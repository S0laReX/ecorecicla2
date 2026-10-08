// Isolated real-MySQL suite: creates and drops a random test database only.
const fs=require('node:fs');const path=require('node:path');const {randomUUID,randomBytes}=require('node:crypto');
const assert=require('node:assert/strict');const mysql=require('mysql2/promise');const request=require('supertest');const sharp=require('sharp');
const databaseName=`ecorecicla_test_${randomBytes(8).toString('hex')}`;
process.env.DB_NAME=databaseName;process.env.NODE_ENV='test';
const app=require('../src/app');const {pool}=require('../src/config/database');const {hashPassword}=require('../src/services/passwordService');
let checks=0;const passed=label=>{checks++;console.log(`PASS ${label}`);};
(async()=>{
 const connection=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,multipleStatements:true});
 let created=false;
 try{
  assert.match(databaseName,/^ecorecicla_test_[a-f0-9]{16}$/);
  await connection.query(`CREATE DATABASE ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);created=true;
  await connection.changeUser({database:databaseName});
  for(const file of ['001_sprint1.sql','002_accounts.sql','003_company_verification.sql','004_collection_reservations.sql','005_collection_confirmation.sql'])await connection.query(fs.readFileSync(path.join(__dirname,'../../database',file),'utf8'));
  const password='ReservationsTest2026';const passwordHash=await hashPassword(password);
  async function account(role,verification,displayName){
   const userUUID=randomUUID();const email=`${userUUID}@example.test`;
   const [insert]=await connection.execute('INSERT INTO User (internalUUID,displayName,email,passwordHash,roleCode,verificationStatus,verificationDocumentKey) VALUES (?,?,?,?,?,?,?)',[userUUID,displayName,email,passwordHash,role,verification,role==='COMPANY'?randomUUID():null]);
   const login=await request(app).post('/api/auth/login').send({email,password});assert.equal(login.status,200);
   return {userId:String(insert.insertId),token:login.body.data.tokens.accessToken};
  }
  const collector=await account('COMPANY','APPROVED','Empresa recolectora');
  const otherCollector=await account('COMPANY','APPROVED','Segunda empresa');
  const pendingCollector=await account('COMPANY','PENDING','Empresa pendiente');
  const publisher=await account('USER','NOT_REQUIRED','Persona publicadora');
  const jpeg=await sharp({create:{width:40,height:40,channels:3,background:'#006c49'}}).jpeg().toBuffer();
  async function publication(ownerId,availabilityText='Lunes a viernes de 09:00 a 17:00'){
   const publicationUUID=randomUUID();
   await connection.execute('INSERT INTO Publication (internalUUID,ownerId,materialType,quantityKg,locationText,availabilityText,photoJpeg,status) VALUES (?,?,?,?,?,?,?,?)',[publicationUUID,ownerId,'plastico','2.125','Zona central',availabilityText,jpeg,'disponible']);
   return publicationUUID;
  }
  const offeredPublication=await publication(publisher.userId);const ownPublication=await publication(collector.userId);const unstructuredPublication=await publication(publisher.userId,'Cuando puedas');
  const futureSchedule=()=>{const date=new Date(Date.now()+7*24*60*60*1000);date.setUTCHours(14,0,0,0);return date.toISOString();};
  const outsideHoursSchedule=()=>{const date=new Date(Date.now()+7*24*60*60*1000);date.setUTCHours(22,0,0,0);return date.toISOString();};
  const base='/api/collections';const accept=(publicationUUID,token=collector.token,body={scheduledAt:futureSchedule()})=>request(app).post(`${base}/publications/${publicationUUID}/accept`).auth(token,{type:'bearer'}).send(body);
  const agenda=(token=collector.token,url='/agenda')=>request(app).get(`${base}${url}`).auth(token,{type:'bearer'});
  const cancel=(reservationUUID,token=collector.token)=>request(app).post(`${base}/reservations/${reservationUUID}/cancel`).auth(token,{type:'bearer'});
  assert.equal((await request(app).get(`${base}/agenda`)).status,401);passed('agenda requires authentication');
  assert.equal((await accept(offeredPublication,pendingCollector.token)).status,403);
  assert.equal((await accept(offeredPublication,publisher.token)).status,403);passed('only active, approved collector companies can accept publications');
  assert.equal((await accept('invalid-uuid')).status,422);
  assert.equal((await accept(offeredPublication,collector.token,{})).status,422);
  assert.equal((await accept(offeredPublication,collector.token,{scheduledAt:'not-a-date'})).status,422);
  assert.equal((await accept(offeredPublication,collector.token,{scheduledAt:new Date(Date.now()-60000).toISOString()})).status,422);
  assert.equal((await accept(offeredPublication,collector.token,{scheduledAt:outsideHoursSchedule()})).body.errorCode,'SCHEDULE_OUTSIDE_WINDOW');
  assert.equal((await accept(unstructuredPublication,collector.token)).body.errorCode,'AVAILABILITY_WINDOW_UNVERIFIABLE');
  assert.equal((await accept(offeredPublication,collector.token,{scheduledAt:futureSchedule(),ownerId:'1'})).status,422);
  assert.equal((await accept(ownPublication)).status,404);passed('reservation UUID, strict body, future and published availability window, structured hours, and ownership validations');
  const accepted=await accept(offeredPublication);assert.equal(accepted.status,201);assert.equal(accepted.body.success,true);
  const reservationUUID=accepted.body.data.reservationUUID;assert.equal(accepted.body.data.publicationUUID,offeredPublication);passed('an available third-party publication is accepted and assigned a reservation UUID');
  const availableList=await request(app).get(`${base}/publications`).auth(collector.token,{type:'bearer'});
  assert.equal(availableList.status,200);assert.equal(availableList.body.data.meta.total,1);
  assert.equal((await request(app).get(`${base}/publications/${offeredPublication}`).auth(collector.token,{type:'bearer'})).status,404);
  const ownerList=await request(app).get('/api/publications/me').auth(publisher.token,{type:'bearer'});
  assert.equal(ownerList.status,200);assert.equal(ownerList.body.data.find(item=>item.publicationUUID===offeredPublication).publicationStatus,'aceptada');passed('accepted publication leaves exploration and its owner sees the accepted state in My Publications');
  const agendaResult=await agenda();assert.equal(agendaResult.status,200);assert.equal(agendaResult.body.data.meta.total,1);
  assert.equal(agendaResult.body.data.reservations[0].reservationUUID,reservationUUID);
  assert.equal(agendaResult.body.data.reservations[0].publisherName,'Persona publicadora');
  assert.equal(agendaResult.body.data.reservations[0].reservationStatus,'ACEPTADA');passed('agenda returns the selected schedule, real publication details and publisher');
  assert.equal((await agenda(otherCollector.token)).body.data.meta.total,0);
  assert.equal((await agenda(pendingCollector.token)).status,403);
  assert.equal((await agenda(collector.token,'/agenda?page=0')).status,422);passed('agenda is isolated by company and validates access and pagination');
  assert.equal((await cancel(reservationUUID,otherCollector.token)).status,404);
  assert.equal((await cancel(reservationUUID,publisher.token)).status,403);passed('only the company that owns an active reservation may cancel it');
  const cancelled=await cancel(reservationUUID);assert.equal(cancelled.status,200);assert.equal(cancelled.body.data.publicationStatus,'disponible');
  assert.equal((await agenda()).body.data.meta.total,0);
  assert.equal((await request(app).get(`${base}/publications`).auth(collector.token,{type:'bearer'})).body.data.meta.total,2);
  assert.equal((await cancel(reservationUUID)).status,409);passed('cancellation is one-time, restores availability and removes the item from agenda');
  const racing=await Promise.all([accept(offeredPublication,collector.token),accept(offeredPublication,otherCollector.token)]);
  assert.deepEqual(racing.map(response=>response.status).sort(),[201,409]);
  assert.equal((await connection.execute('SELECT COUNT(*) AS activeCount FROM CollectionReservation WHERE publicationId=(SELECT id FROM Publication WHERE internalUUID=?) AND status=?',[offeredPublication,'ACEPTADA']))[0][0].activeCount,1);
  passed('concurrent acceptance has exactly one winner and one active database reservation');
  assert.equal((await accept(offeredPublication)).status,409);passed('an already accepted publication cannot be reserved again');
  assert.equal((await cancel('invalid-uuid')).status,422);assert.equal((await cancel(randomUUID())).status,404);passed('cancellation validates UUID and hides reservations belonging to other companies');
  await request(app).post('/api/auth/logout').auth(collector.token,{type:'bearer'});
  assert.equal((await agenda(collector.token)).status,401);passed('revoked sessions cannot access the agenda');
  console.log(`${checks} reservation integration scenarios passed.`);
 }finally{
  await pool.end();
  if(created&&/^ecorecicla_test_[a-f0-9]{16}$/.test(databaseName))await connection.query(`DROP DATABASE ${databaseName}`);
  await connection.end();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
