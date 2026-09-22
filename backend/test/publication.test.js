const {test,after} = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const {generateKeyPairSync,randomUUID} = require('node:crypto');
const Publication = require('../src/models/Publication');
const {pool} = require('../src/config/database');
const {normalizePhoto,authorizePublisher} = require('../src/services/publicationService');
const {publicationFieldsSchema} = require('../src/schemas/publicationSchema');
const app = require('../src/app');
const fields={materialType:'plastico',quantityKg:'2.125',locationText:'Zona central',availabilityText:'Lunes 09:00–12:00'};
const user={userId:'1',userUUID:randomUUID(),userRoleCode:'COMPANY',userAccountStatus:'ACTIVE',userVerificationStatus:'PENDING',userTokenVersion:0};
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
process.env.JWT_PUBLIC_KEY=publicKey.export({format:'pem',type:'spki'}).toString();
process.env.JWT_ISSUER='test-auth';process.env.JWT_AUDIENCE='test-api';
const sign=(options={})=>jwt.sign({sub:user.userUUID,tokenVersion:0},privateKey,{algorithm:'RS256',expiresIn:'30m',issuer:'test-auth',audience:'test-api',...options});
after(()=>pool.end());
test('rejects client ownership, status, unknown material and invalid decimals',()=>{
 for(const patch of [{ownerId:'2'},{status:'confirmada'},{materialType:'battery'},{quantityKg:'0'},{quantityKg:'-1'},{quantityKg:'1e3'},{quantityKg:'1.2345'},{quantityKg:'10000000'}])
  assert.equal(publicationFieldsSchema.safeParse({...fields,...patch}).success,false);
});
test('pending company can publish; suspended, rejected, admin and revoked session cannot',()=>{
 assert.doesNotThrow(()=>authorizePublisher(user,0));
 for(const patch of [{userAccountStatus:'SUSPENDED'},{userVerificationStatus:'REJECTED'},{userRoleCode:'ADMIN'},{userTokenVersion:1}])assert.throws(()=>authorizePublisher({...user,...patch},0));
 assert.throws(()=>authorizePublisher(null,0));
});
test('photo content verified independently of MIME and file extension',async()=>{
 await assert.rejects(normalizePhoto({buffer:Buffer.from('<svg/>'),size:6,mimetype:'image/jpeg'}),{errorCode:'PHOTO_INVALID'});
 await assert.rejects(normalizePhoto({buffer:Buffer.alloc(1),size:6*1024*1024}),{errorCode:'PHOTO_INVALID'});
 const png=await sharp({create:{width:8,height:8,channels:3,background:'#12aa66'}}).png().toBuffer();
 const jpeg=await normalizePhoto({buffer:png,size:png.length,mimetype:'text/plain'});
 assert.equal((await sharp(jpeg).metadata()).format,'jpeg');
});
test('update rejects mass assignment before executing SQL; predicates enforce owner/status',async()=>{
 const calls=[];const connection={execute:async(q,p)=>{calls.push([q,p]);return [{affectedRows:0}];}};
 await assert.rejects(Publication.updateByUUID(randomUUID(),'1',{ownerId:'2'},connection),{errorCode:'VALIDATION_ERROR'});
 assert.equal(calls.length,0);
 await assert.rejects(Publication.updateByUUID(randomUUID(),'1',{locationText:'New location'},connection),{statusCode:409});
 assert.match(calls[0][0],/ownerId = \? AND status = \? AND deletedAt IS NULL/);
 assert.equal(calls[0][1].at(-1),'disponible');
 await assert.rejects(Publication.softDeleteByUUID(randomUUID(),'1',connection),{statusCode:409});
});
test('HTTP rejects missing, expired and wrong-audience JWT using official error contract',async()=>{
 for(const token of [null,sign({expiresIn:-1}),sign({audience:'other'})]){
  let req=request(app).post('/api/publications');if(token)req=req.set('Authorization',`Bearer ${token}`);
  const res=await req;assert.equal(res.status,401);assert.deepEqual(Object.keys(res.body).sort(),['errorCode','message','statusCode','success']);
  assert.equal(res.body.statusCode,401);
 }
});
test('HTTP creation commits, ignores no unknown fields, rolls back safely on DB failure',async()=>{
 const original=pool.getConnection;let committed=0,rolledBack=0,released=0,fail=false;
 const png=await sharp({create:{width:8,height:8,channels:3,background:'#12aa66'}}).png().toBuffer();
 let saved;
 pool.getConnection=async()=>({beginTransaction:async()=>{},commit:async()=>{committed++;},rollback:async()=>{rolledBack++;},release:()=>{released++;},execute:async(q,p)=>{
  if(q.includes('FROM User'))return [[user]];
  if(q.startsWith('INSERT')){if(fail)throw new Error('SECRET SQL PASSWORD');saved=p;return [{affectedRows:1}];}
  return [[{publicationUUID:saved[0],publicationMaterialType:saved[2],publicationQuantityKg:saved[3],publicationLocationText:saved[4],publicationAvailabilityText:saved[5],publicationStatus:saved[7],publicationPhotoDataUrl:'data:image/jpeg;base64,'+saved[6].toString('base64')}]];
 }});
 try{
  const send=()=>request(app).post('/api/publications').set('Authorization',`Bearer ${sign()}`).field(fields).attach('photo',png,'photo.png');
  const ok=await send();assert.equal(ok.status,201);assert.equal(ok.body.data.publicationStatus,'disponible');assert.equal(committed,1);assert.equal(released,1);
  fail=true;const failed=await send();assert.equal(failed.status,500);assert.equal(rolledBack,1);assert.equal(released,2);assert.ok(!JSON.stringify(failed.body).includes('SECRET'));
 } finally {pool.getConnection=original;}
});
