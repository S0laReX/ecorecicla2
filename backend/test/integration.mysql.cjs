// Opt-in integration suite: creates its own randomly named database; never uses application rows.
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');const assert=require('node:assert/strict');
const mysql=require('mysql2/promise');const request=require('supertest');const sharp=require('sharp');const {PDFDocument}=require('pdf-lib');
const databaseName=`ecorecicla_test_${crypto.randomBytes(8).toString('hex')}`;
process.env.DB_NAME=databaseName;process.env.RECOVERY_DELIVERY='local';process.env.NODE_ENV='test';
const app=require('../src/app');const {pool}=require('../src/config/database');
const password='IntegrationPassword123';let passed=0;
const check=(label)=>{passed++;console.log(`PASS ${label}`);};
(async()=>{
 const admin=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,multipleStatements:true});
 try{
  if(!/^ecorecicla_test_[a-f0-9]{16}$/.test(databaseName))throw new Error('Unsafe test database');
  await admin.query(`CREATE DATABASE ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
  await admin.changeUser({database:databaseName});
  await admin.query(fs.readFileSync(path.resolve(__dirname,'../../database/001_sprint1.sql'),'utf8'));
  await admin.query(fs.readFileSync(path.resolve(__dirname,'../../database/002_accounts.sql'),'utf8'));
  const register=(email)=>request(app).post('/api/auth/register').field({displayName:'Integration User',email,password,roleCode:'USER'});
  const created=await register('one@example.test');assert.equal(created.status,201);check('register user in real MySQL');
  assert.equal((await register('one@example.test')).status,409);check('duplicate email rejected');
  const login=()=>request(app).post('/api/auth/login').send({email:'one@example.test',password});
  const session=await login();assert.equal(session.status,200);let access=session.body.data.tokens.accessToken;
  const userUUID=created.body.data.userUUID;const refreshToken=session.body.data.tokens.refreshToken;
  assert.equal((await request(app).get('/api/auth/me').auth(access,{type:'bearer'})).status,200);
  assert.equal((await request(app).get('/api/auth/dashboard/ADMIN').auth(access,{type:'bearer'})).status,403);check('login, current account and role separation');
  const renewed=await request(app).post('/api/auth/refresh').send({userUUID,refreshToken});assert.equal(renewed.status,200);access=renewed.body.data.tokens.accessToken;
  assert.equal((await request(app).post('/api/auth/refresh').send({userUUID,refreshToken})).status,401);
  assert.equal((await request(app).get('/api/auth/me').auth(access,{type:'bearer'})).status,401);check('refresh rotation detects replay and revokes session');
  const next=await login();access=next.body.data.tokens.accessToken;
  assert.equal((await request(app).post('/api/auth/logout').auth(access,{type:'bearer'})).status,200);
  assert.equal((await request(app).get('/api/auth/me').auth(access,{type:'bearer'})).status,401);check('logout invalidates access token immediately');
  const pdf=await PDFDocument.create();pdf.addPage();const buffer=Buffer.from(await pdf.save());
  const company=await request(app).post('/api/auth/register').field({displayName:'Integration Company',email:'company@example.test',password,roleCode:'COMPANY',taxIdentifier:'TEST-1234',contactName:'Test Contact',coverageArea:'Centro'}).attach('document',buffer,'company.pdf');
  assert.equal(company.status,201);assert.equal(company.body.data.verificationStatus,'PENDING');
  const companyLogin=await request(app).post('/api/auth/login').send({email:'company@example.test',password});assert.equal(companyLogin.status,200);
  assert.equal((await request(app).get('/api/auth/dashboard/COMPANY').auth(companyLogin.body.data.tokens.accessToken,{type:'bearer'})).status,403);check('company document persisted and pending dashboard blocked');
  const [documents]=await admin.execute('SELECT OCTET_LENGTH(documentContent) AS bytes FROM CompanyProfile');assert.ok(documents[0].bytes>0);
  const before=new Set(fs.existsSync(path.resolve(__dirname,'../.local/recovery'))?fs.readdirSync(path.resolve(__dirname,'../.local/recovery')):[]);
  const resetRequest=await request(app).post('/api/auth/forgot-password').send({email:'one@example.test'});assert.equal(resetRequest.status,200);
  assert.deepEqual((await request(app).post('/api/auth/forgot-password').send({email:'missing@example.test'})).body,resetRequest.body);
  const directory=path.resolve(__dirname,'../.local/recovery');const filename=fs.readdirSync(directory).find(name=>!before.has(name));assert.ok(filename);
  const text=fs.readFileSync(path.join(directory,filename),'utf8');const token=/token=([a-f0-9]{64})/.exec(text)[1];
  const reset=()=>request(app).post('/api/auth/reset-password').send({userUUID,token,password:'NewIntegrationPassword123'});
  assert.equal((await reset()).status,200);assert.equal((await reset()).status,422);assert.equal((await login()).status,401);check('password recovery: uniform response, one-time token and new password');
  fs.unlinkSync(path.join(directory,filename));
  console.log(`${passed} real MySQL integration checks passed.`);
 }finally{
  await pool.end();if(/^ecorecicla_test_[a-f0-9]{16}$/.test(databaseName))await admin.query(`DROP DATABASE IF EXISTS ${databaseName}`);await admin.end();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
