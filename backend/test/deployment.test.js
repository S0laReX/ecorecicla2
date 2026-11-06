const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {generateKeyPairSync}=require('node:crypto');
const express=require('express');
const request=require('supertest');
const {serverConfig,trustProxyHops}=require('../src/config/runtime');
const {databaseOptions}=require('../src/config/databaseOptions');
const {pool}=require('../src/config/database');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'ecorecicla-deployment-'));
const keys=generateKeyPairSync('rsa',{modulusLength:2048});
const privatePath=path.join(directory,'private.pem');
fs.writeFileSync(privatePath,keys.privateKey.export({type:'pkcs8',format:'pem'}));
const env={NODE_ENV:'production',DB_HOST:'db.example.test',DB_NAME:'test',DB_USER:'test',DB_PASSWORD:'private',
 JWT_PUBLIC_KEY:keys.publicKey.export({type:'spki',format:'pem'}).toString().replace(/\n/g,'\\n'),JWT_PRIVATE_KEY_PATH:privatePath,
 JWT_ISSUER:'test',JWT_AUDIENCE:'test',FRONTEND_ORIGIN:'https://frontend.example.test'};
after(async()=>{
 await pool.end();
 fs.unlinkSync(privatePath);fs.rmdirSync(directory);
});

test('production startup accepts injected environment and rejects invalid keys or configuration',()=>{
 assert.deepEqual(serverConfig(env),{port:4000,host:'0.0.0.0'});
 assert.deepEqual(serverConfig({...env,PORT:'10000'}),{port:10000,host:'0.0.0.0'});
 assert.equal(serverConfig({...env,NODE_ENV:'development'}).host,'127.0.0.1');
 for(const patch of [{PORT:'0'},{PORT:'invalid'},{DB_PASSWORD:''},{FRONTEND_ORIGIN:'http://frontend.example.test'},
  {FRONTEND_ORIGIN:'https://frontend.example.test/path'},{JWT_PRIVATE_KEY_PATH:'missing-private.pem'},
  {JWT_PUBLIC_KEY:generateKeyPairSync('rsa',{modulusLength:2048}).publicKey.export({type:'spki',format:'pem'}).toString()}]){
  assert.throws(()=>serverConfig({...env,...patch}));
 }
});

test('TLS verifies certificates and shared database settings reject invalid options',()=>{
 const options=databaseOptions({...env,DB_SSL:'true',DB_PORT:'3307'});
 assert.equal(options.port,3307);assert.equal(options.ssl.rejectUnauthorized,true);
 assert.equal(databaseOptions({...env,DB_SSL:'false'}).ssl,undefined);
 for(const patch of [{DB_SSL:'false',DB_SSL_CA_PATH:'ignored.pem'},{DB_SSL:'yes'},{DB_PORT:'0'},{DB_PORT:'65536'}]){
  assert.throws(()=>databaseOptions({...env,...patch}));
 }
});

test('trusted hop count ignores spoofed leftmost forwarding addresses',async()=>{
 assert.equal(trustProxyHops({}),false);
 for(const value of ['true','-1','1.5','99'])assert.throws(()=>trustProxyHops({TRUST_PROXY_HOPS:value}));
 const app=express();app.set('trust proxy',trustProxyHops({TRUST_PROXY_HOPS:'1'}));
 app.get('/ip',(req,res)=>res.json({ip:req.ip}));
 const result=await request(app).get('/ip').set('X-Forwarded-For','203.0.113.99, 198.51.100.22');
 assert.equal(result.body.ip,'198.51.100.22');
});

test('health endpoints reflect database failure and shutdown without exposing details',async()=>{
 const app=express();app.use('/api',require('../src/routes/healthRoutes'));
 const original=pool.query;
 try{
  pool.query=async()=>{throw Error('SECRET database credentials');};
  assert.equal((await request(app).get('/api/health')).status,200);
  const failed=await request(app).get('/api/ready');assert.equal(failed.status,503);assert.deepEqual(failed.body,{success:false});
  pool.query=async()=>[[],[]];
  assert.equal((await request(app).get('/api/ready')).status,200);
  app.locals.shuttingDown=true;
  assert.equal((await request(app).get('/api/health')).status,503);
  assert.equal((await request(app).get('/api/ready')).status,503);
 }finally{pool.query=original;}
});
