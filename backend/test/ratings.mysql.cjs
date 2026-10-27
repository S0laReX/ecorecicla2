// Real MySQL, isolated random database. Never writes application data.
const fs=require('node:fs');const path=require('node:path');const {randomUUID,randomBytes}=require('node:crypto');
const assert=require('node:assert/strict');const mysql=require('mysql2/promise');const request=require('supertest');const sharp=require('sharp');
const databaseName=`ecorecicla_test_${randomBytes(8).toString('hex')}`;
process.env.DB_NAME=databaseName;process.env.NODE_ENV='test';
const app=require('../src/app');const {pool}=require('../src/config/database');const {hashPassword}=require('../src/services/passwordService');
let checks=0;const passed=label=>{checks++;console.log(`PASS ${label}`);};
(async()=>{
 const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,multipleStatements:true,timezone:'Z'});let created=false;
 try{
  assert.match(databaseName,/^ecorecicla_test_[a-f0-9]{16}$/);await db.query(`CREATE DATABASE ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);created=true;await db.changeUser({database:databaseName});
  for(const file of ['001_sprint1.sql','002_accounts.sql','003_company_verification.sql','004_collection_reservations.sql'])await db.query(fs.readFileSync(path.join(__dirname,'../../database',file),'utf8'));
  await require('../scripts/migrate-confirmation.cjs')(db);await db.query(fs.readFileSync(path.join(__dirname,'../../database/006_collection_ratings.sql'),'utf8'));
  const password='RatingsTest2026';const hash=await hashPassword(password);
  async function account(role,verification){const email=`${randomUUID()}@example.test`;const [row]=await db.execute('INSERT INTO User (internalUUID,displayName,email,passwordHash,roleCode,verificationStatus,verificationDocumentKey) VALUES (?,?,?,?,?,?,?)',[randomUUID(),`Test ${role}`,email,hash,role,verification,role==='COMPANY'?randomUUID():null]);const login=await request(app).post('/api/auth/login').send({email,password});assert.equal(login.status,200);return {id:row.insertId,uuid:(await db.execute('SELECT internalUUID FROM User WHERE id=?',[row.insertId]))[0][0].internalUUID,token:login.body.data.tokens.accessToken};}
  const company=await account('COMPANY','APPROVED');const owner=await account('USER','NOT_REQUIRED');const stranger=await account('USER','NOT_REQUIRED');
  const jpeg=await sharp({create:{width:16,height:16,channels:3,background:'#006c49'}}).jpeg().toBuffer();
  async function collection(){const [p]=await db.execute('INSERT INTO Publication (internalUUID,ownerId,materialType,quantityKg,locationText,availabilityText,photoJpeg,status) VALUES (?,?,?,?,?,?,?,?)',[randomUUID(),owner.id,'plastico','2.000','Zona centro','Lunes a domingo de 00:00 a 23:59',jpeg,'aceptada']);const reservationUUID=randomUUID();const [r]=await db.execute('INSERT INTO CollectionReservation (internalUUID,publicationId,companyUserId,scheduledAt,expiresAt) VALUES (?,?,?,?,?)',[reservationUUID,p.insertId,company.id,new Date(Date.now()-60000),new Date(Date.now()+600000)]);const confirmed=await request(app).post(`/api/collections/reservations/${reservationUUID}/confirm`).auth(company.token,{type:'bearer'});assert.equal(confirmed.status,200);return {reservationUUID,reservationId:r.insertId};}
  const reservation=await collection();const endpoint=`/api/ratings/reservations/${reservation.reservationUUID}`;
  assert.equal((await request(app).get('/api/ratings/pending')).status,401);assert.equal((await request(app).get('/api/ratings/me').auth(owner.token,{type:'bearer'})).body.data.average,null);
  let pending=await request(app).get('/api/ratings/pending').auth(company.token,{type:'bearer'});assert.equal(pending.status,200);assert.equal(pending.body.data.items.length,1);assert.equal(pending.body.data.items[0].ratedUserUUID,owner.uuid);
  assert.equal((await request(app).post(endpoint).auth(stranger.token,{type:'bearer'}).send({score:5})).status,404);
  for(const body of [{},{score:0},{score:6},{score:2.5},{score:'5'},{score:5,comment:'hello'},{score:5,ratedUserUUID:owner.uuid}])assert.equal((await request(app).post(endpoint).auth(company.token,{type:'bearer'}).send(body)).status,422);
  assert.equal((await request(app).post(endpoint).auth(company.token,{type:'bearer'}).send({score:5})).status,201);assert.equal((await request(app).post(endpoint).auth(company.token,{type:'bearer'}).send({score:4})).status,409);
  let profile=await request(app).get('/api/ratings/me').auth(owner.token,{type:'bearer'});assert.deepEqual(profile.body.data,{average:5,count:1});
  pending=await request(app).get('/api/ratings/pending').auth(company.token,{type:'bearer'});assert.equal(pending.body.data.items.length,0);
  assert.equal((await request(app).post(endpoint).auth(owner.token,{type:'bearer'}).send({score:3})).status,201);
  profile=await request(app).get('/api/ratings/me').auth(owner.token,{type:'bearer'});assert.deepEqual(profile.body.data,{average:5,count:1});
  profile=await request(app).get('/api/ratings/me').auth(company.token,{type:'bearer'});assert.deepEqual(profile.body.data,{average:3,count:1});
  const [rows]=await db.execute('SELECT raterUserId,ratedUserId,score FROM CollectionRating WHERE reservationId=?',[reservation.reservationId]);assert.equal(rows.length,2);assert.ok(rows.every(row=>row.raterUserId!==row.ratedUserId));passed('only participants rate once; strict scores, pending list, and recipient averages are correct');
  const another=await collection();await db.execute('UPDATE CollectionReservation SET status=? WHERE internalUUID=?',['CANCELADA',another.reservationUUID]);assert.equal((await request(app).post(`/api/ratings/reservations/${another.reservationUUID}`).auth(company.token,{type:'bearer'}).send({score:4})).status,409);passed('cancelled or unconfirmed collections cannot be rated');
  console.log(`${checks} rating scenarios passed.`);
 }finally{await pool.end();if(created&&/^ecorecicla_test_[a-f0-9]{16}$/.test(databaseName))await db.query(`DROP DATABASE ${databaseName}`);await db.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
