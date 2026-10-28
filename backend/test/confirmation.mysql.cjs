// Real MySQL, isolated random database. Never writes application data.
const fs=require('node:fs');const path=require('node:path');const {randomUUID,randomBytes}=require('node:crypto');
const assert=require('node:assert/strict');const mysql=require('mysql2/promise');const request=require('supertest');const sharp=require('sharp');
const databaseName=`ecorecicla_test_${randomBytes(8).toString('hex')}`;
process.env.DB_NAME=databaseName;process.env.NODE_ENV='test';
const app=require('../src/app');const {pool}=require('../src/config/database');const {hashPassword}=require('../src/services/passwordService');
const {releaseExpiredReservations}=require('../src/services/collectionExpiryService');
const Award=require('../src/models/CollectionPointAward');
let checks=0;const passed=label=>{checks++;console.log(`PASS ${label}`);};
(async()=>{
 const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,multipleStatements:true,timezone:'Z'});let created=false;
 try{
  assert.match(databaseName,/^ecorecicla_test_[a-f0-9]{16}$/);await db.query(`CREATE DATABASE ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);created=true;await db.changeUser({database:databaseName});
  for(const file of ['001_sprint1.sql','002_accounts.sql','003_company_verification.sql','004_collection_reservations.sql','010_notices.sql'])await db.query(fs.readFileSync(path.join(__dirname,'../../database',file),'utf8'));
  const password='ConfirmationTest2026';const hash=await hashPassword(password);
  async function account(role,verification){
   const email=`${randomUUID()}@example.test`;
   const [row]=await db.execute('INSERT INTO User (internalUUID,displayName,email,passwordHash,roleCode,verificationStatus,verificationDocumentKey) VALUES (?,?,?,?,?,?,?)',[randomUUID(),`Test ${role}`,email,hash,role,verification,role==='COMPANY'?randomUUID():null]);
   const login=await request(app).post('/api/auth/login').send({email,password});assert.equal(login.status,200);
   return {id:row.insertId,token:login.body.data.tokens.accessToken};
  }
  const company=await account('COMPANY','APPROVED');const other=await account('COMPANY','APPROVED');const owner=await account('USER','NOT_REQUIRED');const pending=await account('COMPANY','PENDING');
  const jpeg=await sharp({create:{width:16,height:16,channels:3,background:'#006c49'}}).jpeg().toBuffer();
  async function publication(material='plastico'){
   const uuid=randomUUID();const [p]=await db.execute('INSERT INTO Publication (internalUUID,ownerId,materialType,quantityKg,locationText,availabilityText,photoJpeg,status) VALUES (?,?,?,?,?,?,?,?)',[uuid,owner.id,material,'2.000','Zona centro','Lunes a domingo de 00:00 a 23:59',jpeg,'aceptada']);return {uuid,id:p.insertId};
  }
  const old=await publication();const oldUUID=randomUUID();const scheduled=new Date(Date.now()+86400000);scheduled.setUTCHours(16,0,0,0);
  await db.execute('INSERT INTO CollectionReservation (internalUUID,publicationId,companyUserId,scheduledAt) VALUES (?,?,?,?)',[oldUUID,old.id,company.id,scheduled]);
  const migrate=require('../scripts/migrate-confirmation.cjs');await migrate(db);await migrate(db);
  await db.query(fs.readFileSync(path.join(__dirname,'../../database/008_material_point_settings.sql'),'utf8'));
  const [migrated]=await db.execute('SELECT expiresAt FROM CollectionReservation WHERE internalUUID=?',[oldUUID]);assert.ok(migrated[0].expiresAt>scheduled);passed('US8 active bookings backfilled; migration safely reruns');
  async function reservation(start=-60000,end=600000,material='plastico'){
   const p=await publication(material);const uuid=randomUUID();const [r]=await db.execute('INSERT INTO CollectionReservation (internalUUID,publicationId,companyUserId,scheduledAt,expiresAt) VALUES (?,?,?,?,?)',[uuid,p.id,company.id,new Date(Date.now()+start),new Date(Date.now()+end)]);return {...p,reservationUUID:uuid,reservationId:r.insertId};
  }
  const endpoint=r=>`/api/collections/reservations/${r.reservationUUID}/confirm`;
  const confirm=(r,token=company.token,body)=>request(app).post(endpoint(r)).auth(token,{type:'bearer'}).send(body);
  const points=async r=>{const [rows]=await db.execute('SELECT recipientUserId,recipientRole,points FROM CollectionPointAward WHERE reservationId=?',[r.reservationId]);return rows;};
  const states=async r=>{const [rows]=await db.execute('SELECT C.status,C.confirmedAt,P.status AS publicationStatus FROM CollectionReservation C JOIN Publication P ON P.id=C.publicationId WHERE C.id=?',[r.reservationId]);return rows[0];};
  const early=await reservation(600000,1200000);assert.equal((await confirm(early)).body.errorCode,'CONFIRMATION_TOO_EARLY');assert.equal((await points(early)).length,0);assert.equal((await states(early)).status,'ACEPTADA');
  assert.equal((await request(app).post(endpoint(early))).status,401);
  for(const account of [owner,pending])assert.equal((await confirm(early,account.token)).status,403);
  assert.equal((await confirm(early,other.token)).status,404);assert.equal((await confirm(early,company.token,{points:9999})).status,422);passed('early confirmation, wrong company, forbidden roles and client points blocked');
  const expired=await reservation(-120000,-60000);assert.equal((await confirm(expired)).body.errorCode,'RESERVATION_EXPIRED');assert.equal((await states(expired)).status,'VENCIDA');assert.equal((await states(expired)).publicationStatus,'disponible');assert.equal((await points(expired)).length,0);passed('expired confirmation commits release without granting points');
  for(const material of ['plastico','papel','vidrio','metal','organico']){
   const r=await reservation(-60000,600000,material);const result=await confirm(r);assert.equal(result.status,200);assert.equal(result.body.data.publisherPoints,10);assert.equal(result.body.data.collectorPoints,10);assert.ok(result.body.data.confirmedAt);
   const awards=await points(r);assert.equal(awards.length,2);assert.deepEqual(new Set(awards.map(a=>Number(a.recipientUserId))),new Set([company.id,owner.id]));assert.ok(awards.every(a=>a.points===10));
   assert.equal((await states(r)).publicationStatus,'confirmada');assert.equal((await states(r)).status,'CONFIRMADA');assert.ok((await states(r)).confirmedAt);
   assert.equal((await confirm(r)).status,409);assert.equal((await request(app).post(`/api/collections/reservations/${r.reservationUUID}/cancel`).auth(company.token,{type:'bearer'})).status,409);assert.equal((await points(r)).length,2);
  }passed('all five materials grant exactly 10 points to both participants, persist time, reject repeats and cancellation');
  const concurrent=await reservation();const responses=await Promise.all([confirm(concurrent),confirm(concurrent)]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);assert.equal((await points(concurrent)).length,2);passed('simultaneous confirmations cannot duplicate points');
  const failure=await reservation();const original=Award.create;let count=0;
  try{Award.create=async(...args)=>{if(++count===2)throw new Error('Injected database failure');return original(...args);};assert.equal((await confirm(failure)).status,500);}
  finally{Award.create=original;}
  assert.equal((await points(failure)).length,0);assert.equal((await states(failure)).status,'ACEPTADA');assert.equal((await states(failure)).publicationStatus,'aceptada');assert.equal((await confirm(failure)).status,200);passed('second-award failure rolls back both states and first award; safe retry succeeds');
  const cancelled=await reservation();assert.equal((await request(app).post(`/api/collections/reservations/${cancelled.reservationUUID}/cancel`).auth(company.token,{type:'bearer'})).status,200);assert.equal((await confirm(cancelled)).status,409);assert.equal((await points(cancelled)).length,0);
  const race=await reservation();await Promise.all([confirm(race),request(app).post(`/api/collections/reservations/${race.reservationUUID}/cancel`).auth(company.token,{type:'bearer'})]);
  const raceState=await states(race);assert.ok(['CONFIRMADA','CANCELADA'].includes(raceState.status));assert.equal((await points(race)).length,raceState.status==='CONFIRMADA'?2:0);passed('cancellation and confirmation serialize consistently');
  const swept=await reservation(-120000,-60000);const expiryRace=await Promise.all([releaseExpiredReservations(),releaseExpiredReservations(),confirm(swept)]);assert.equal(expiryRace[2].status,409);
  assert.equal((await states(swept)).status,'VENCIDA');assert.equal((await states(swept)).publicationStatus,'disponible');assert.equal((await points(swept)).length,0);
  const agenda=await request(app).get('/api/collections/agenda').auth(company.token,{type:'bearer'});assert.equal(agenda.status,200);assert.ok(agenda.body.data.reservations.every(r=>r.reservationUUID!==swept.reservationUUID));passed('worker/read-time expiry releases material and removes it from agenda without penalty');
  const restricted=await reservation();await db.execute('UPDATE User SET accountStatus=? WHERE id=?',['SUSPENDED',company.id]);assert.equal((await confirm(restricted)).status,403);assert.equal((await points(restricted)).length,0);await db.execute('UPDATE User SET accountStatus=? WHERE id=?',['ACTIVE',company.id]);
  await request(app).post('/api/auth/logout').auth(company.token,{type:'bearer'});assert.equal((await confirm(restricted)).status,401);passed('suspension and revoked sessions prevent confirmation');
  console.log(`${checks} confirmation scenarios passed.`);
 }finally{await pool.end();if(created&&/^ecorecicla_test_[a-f0-9]{16}$/.test(databaseName))await db.query(`DROP DATABASE ${databaseName}`);await db.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
