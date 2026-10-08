// Isolated real-MySQL suite: no application account or publication is modified.
const fs=require('node:fs');const path=require('node:path');const {randomUUID,randomBytes}=require('node:crypto');
const assert=require('node:assert/strict');const mysql=require('mysql2/promise');const request=require('supertest');const sharp=require('sharp');
const databaseName=`ecorecicla_test_${randomBytes(8).toString('hex')}`;
process.env.DB_NAME=databaseName;process.env.NODE_ENV='test';
const app=require('../src/app');const {pool}=require('../src/config/database');
const {hashPassword}=require('../src/services/passwordService');
let checks=0;const passed=label=>{checks++;console.log(`PASS ${label}`);};
(async()=>{
 const connection=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,multipleStatements:true});
 let created=false;
 try{
  assert.match(databaseName,/^ecorecicla_test_[a-f0-9]{16}$/);
  await connection.query(`CREATE DATABASE ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);created=true;
  await connection.changeUser({database:databaseName});
  for(const file of ['001_sprint1.sql','002_accounts.sql','003_company_verification.sql'])await connection.query(fs.readFileSync(path.join(__dirname,'../../database',file),'utf8'));
  const password='CollectionsTest2026';const hash=await hashPassword(password);
  async function account(role,verification,name){
   const uuid=randomUUID();const email=`${uuid}@example.test`;
   const [insert]=await connection.execute('INSERT INTO User (internalUUID,displayName,email,passwordHash,roleCode,verificationStatus,verificationDocumentKey) VALUES (?,?,?,?,?,?,?)',[uuid,name,email,hash,role,verification,role==='COMPANY'?randomUUID():null]);
   const response=await request(app).post('/api/auth/login').send({email,password});assert.equal(response.status,200);
   return {id:insert.insertId,token:response.body.data.tokens.accessToken};
  }
  const collector=await account('COMPANY','APPROVED','Empresa aprobada');
  const owner=await account('USER','NOT_REQUIRED','Persona publicadora');
  const pending=await account('COMPANY','PENDING','Empresa pendiente');
  const admin=await account('ADMIN','NOT_REQUIRED','Admin');
  const jpeg=await sharp({create:{width:40,height:40,channels:3,background:'#006c49'}}).jpeg().toBuffer();
  async function publication(ownerId,material,status='disponible',deleted=false){
   const uuid=randomUUID();await connection.execute('INSERT INTO Publication (internalUUID,ownerId,materialType,quantityKg,locationText,availabilityText,photoJpeg,status,deletedAt) VALUES (?,?,?,?,?,?,?,?,?)',[uuid,ownerId,material,'2.125','Zona central','Lunes 09:00 a 12:00',jpeg,status,deleted?new Date():null]);return uuid;
  }
  const plastic=await publication(owner.id,'plastico');const paper=await publication(owner.id,'papel');
  const own=await publication(collector.id,'metal');const accepted=await publication(owner.id,'vidrio','aceptada');
  const confirmed=await publication(owner.id,'organico','confirmada');const deleted=await publication(owner.id,'papel','disponible',true);
  const base='/api/collections/publications';const get=(url,token=collector.token)=>request(app).get(url).auth(token,{type:'bearer'});
  assert.equal((await request(app).get(base)).status,401);
  for(const account of [owner,pending,admin])for(const url of [base,`${base}/${plastic}`])assert.equal((await get(url,account.token)).status,403);
  passed('list and detail require an approved company; guests, users, admins and pending companies denied');
  const list=await get(base);assert.equal(list.status,200);assert.equal(list.body.data.meta.total,2);
  assert.deepEqual(new Set(list.body.data.publications.map(p=>p.publicationUUID)),new Set([plastic,paper]));
  assert.equal(list.headers['cache-control'],'no-store');passed('only available non-owned, non-deleted publications are listed');
  const detail=await get(`${base}/${plastic}`);assert.equal(detail.status,200);assert.equal(detail.body.data.publisherName,'Persona publicadora');
  assert.equal(detail.body.data.publicationQuantityKg,'2.125');assert.match(detail.body.data.publicationPhotoDataUrl,/^data:image\/jpeg;base64,/);
  assert.equal(detail.body.data.email,undefined);assert.equal(detail.body.data.ownerId,undefined);
  for(const uuid of [own,accepted,confirmed,deleted,randomUUID()])assert.equal((await get(`${base}/${uuid}`)).status,404);
  passed('detail includes photo, material, quantity, location, schedule and publisher without private account fields');
  for(const [material,total] of [['plastico',1],['papel',1],['vidrio',0],['metal',0],['organico',0]]){
   const response=await get(`${base}?materialType=${material}`);assert.equal(response.status,200);assert.equal(response.body.data.meta.total,total);
  }
  assert.equal((await get(base)).body.data.meta.total,2);passed('all five filters, empty results and clearing the filter');
  const page1=await get(`${base}?limit=1&page=1`);const page2=await get(`${base}?limit=1&page=2`);
  assert.equal(page1.body.data.meta.total,2);assert.notEqual(page1.body.data.publications[0].publicationUUID,page2.body.data.publications[0].publicationUUID);
  for(const query of ['materialType=invalid','materialType=papel&materialType=metal','page=0','limit=13','ownerId=1',"materialType=%27%20OR%201%3D1"]){assert.equal((await get(`${base}?${query}`)).status,422);}
  assert.equal((await get(`${base}/invalid-uuid`)).status,422);passed('bounded pagination, strict filter validation and injection rejection');
  await connection.execute('UPDATE Publication SET status=? WHERE internalUUID=?',['aceptada',plastic]);
  assert.equal((await get(`${base}/${plastic}`)).status,404);assert.equal((await get(base)).body.data.meta.total,1);passed('newly accepted material disappears from both list and direct detail');
  for(const status of ['PENDING','REJECTED']){
   await connection.execute('UPDATE User SET verificationStatus=? WHERE id=?',[status,collector.id]);
   assert.equal((await get(base)).status,403);assert.equal((await get(`${base}/${paper}`)).status,403);
  }
  await connection.execute('UPDATE User SET verificationStatus=?,accountStatus=? WHERE id=?',['APPROVED','SUSPENDED',collector.id]);
  assert.equal((await get(base)).status,403);assert.equal((await get(`${base}/${paper}`)).status,403);
  await connection.execute('UPDATE User SET accountStatus=? WHERE id=?',['ACTIVE',collector.id]);
  await request(app).post('/api/auth/logout').auth(collector.token,{type:'bearer'});
  assert.equal((await get(base)).status,401);passed('current approval, suspension and session revocation enforced even with an existing JWT');
  console.log(`${checks} integration scenarios passed.`);
 }finally{
  await pool.end();
  if(created&&/^ecorecicla_test_[a-f0-9]{16}$/.test(databaseName))await connection.query(`DROP DATABASE ${databaseName}`);
  await connection.end();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
