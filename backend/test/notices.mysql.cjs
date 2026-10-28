// Isolated integration database: no application records are modified.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {randomUUID,randomBytes}=require('node:crypto');const mysql=require('mysql2/promise'),request=require('supertest');
const name='ecorecicla_test_'+randomBytes(8).toString('hex');process.env.DB_NAME=name;process.env.NODE_ENV='test';
const app=require('../src/app'),{pool}=require('../src/config/database'),{hashPassword}=require('../src/services/passwordService');
const Notice=require('../src/models/Notice');let checks=0;const pass=label=>console.log('PASS',++checks,label);
(async()=>{
 const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,multipleStatements:true,timezone:'Z'});let created=false;
 try{
  assert.match(name,/^ecorecicla_test_[a-f0-9]{16}$/);await db.query(`CREATE DATABASE ${name} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);created=true;await db.changeUser({database:name});
  for(const file of fs.readdirSync(path.join(__dirname,'../../database')).filter(f=>/^\d{3}_.*\.sql$/.test(f)).sort())await db.query(fs.readFileSync(path.join(__dirname,'../../database',file),'utf8'));
  const password='NoticesTest2026',hash=await hashPassword(password);
  async function account(role,verification){const uuid=randomUUID(),email=uuid+'@example.test';const [row]=await db.execute('INSERT INTO User (internalUUID,displayName,email,passwordHash,roleCode,verificationStatus,verificationDocumentKey) VALUES (?,?,?,?,?,?,?)',[uuid,'QA '+role,email,hash,role,verification,role==='COMPANY'?randomUUID():null]);const result=await request(app).post('/api/auth/login').send({email,password});assert.equal(result.status,200);return {id:String(row.insertId),uuid,email,token:result.body.data.tokens.accessToken,refresh:result.body.data.tokens.refreshToken};}
  const owner=await account('USER','NOT_REQUIRED'),other=await account('USER','NOT_REQUIRED'),collector=await account('COMPANY','APPROVED'),admin=await account('ADMIN','NOT_REQUIRED');
  const get=(person,url='/api/notices')=>request(app).get(url).auth(person.token,{type:'bearer'});
  const read=(person,uuid)=>request(app).patch(`/api/notices/${uuid}/read`).auth(person.token,{type:'bearer'});
  assert.equal((await request(app).get('/api/notices')).status,401);assert.equal((await get(admin)).status,403);assert.equal((await get(owner)).body.meta.total,0);pass('authentication, role separation and empty inbox');
  async function publication(){const uuid=randomUUID();await db.execute('INSERT INTO Publication (internalUUID,ownerId,materialType,quantityKg,locationText,availabilityText,photoJpeg,status) VALUES (?,?,?,?,?,?,?,?)',[uuid,owner.id,'plastico','2.000','Centro','Lunes a domingo de 00:00 a 23:59',Buffer.from('test'),'disponible']);return uuid;}
  const schedule=new Date(Date.now()+86400000);schedule.setUTCHours(16,0,0,0);
  const accept=uuid=>request(app).post(`/api/collections/publications/${uuid}/accept`).auth(collector.token,{type:'bearer'}).send({scheduledAt:schedule.toISOString()});
  const uuid=await publication();const accepted=await accept(uuid);assert.equal(accepted.status,201);const reservationUUID=accepted.body.data.reservationUUID;
  let notices=(await get(owner)).body.data;assert.equal(notices.length,1);assert.equal(notices[0].kind,'ACCEPTED');assert.equal((await get(other)).body.meta.total,0);assert.equal((await get(collector)).body.meta.total,0);assert.equal((await accept(uuid)).status,409);assert.equal((await get(owner)).body.meta.total,1);pass('acceptance notifies publisher only, no duplicate on retry');
  await db.execute('UPDATE CollectionReservation SET scheduledAt=?,expiresAt=? WHERE internalUUID=?',[new Date(Date.now()-60000),new Date(Date.now()+3600000),reservationUUID]);
  const confirm=()=>request(app).post(`/api/collections/reservations/${reservationUUID}/confirm`).auth(collector.token,{type:'bearer'});
  assert.equal((await confirm()).status,200);assert.equal((await confirm()).status,409);
  assert.deepEqual(new Set((await get(owner)).body.data.map(n=>n.kind)),new Set(['ACCEPTED','CONFIRMED','RATE']));assert.deepEqual(new Set((await get(collector)).body.data.map(n=>n.kind)),new Set(['CONFIRMED','RATE']));pass('confirmation and rating reminder reach both participants exactly once');
  const notice=(await get(owner)).body.data[0];assert.equal((await read(other,notice.noticeUUID)).status,404);assert.equal((await get(owner,'/api/notices/unread-count')).body.data.unreadCount,3);
  const marked=await read(owner,notice.noticeUUID);assert.equal(marked.status,200);const repeated=await read(owner,notice.noticeUUID);assert.equal(repeated.body.data.readAt,marked.body.data.readAt);assert.equal((await get(owner,'/api/notices/unread-count')).body.data.unreadCount,2);
  assert.equal((await get(owner,'/api/notices?status=READ')).body.meta.total,1);assert.equal((await get(owner,'/api/notices?status=UNREAD')).body.meta.total,2);
  const paged=await get(owner,'/api/notices?limit=1&page=2');assert.equal(paged.body.data.length,1);assert.equal(paged.body.meta.total,3);assert.notEqual(paged.body.data[0].noticeUUID,notice.noticeUUID);pass('ownership, idempotent read, unread count, filters and pagination');
  for(const suffix of ['?status=INVALID','?page=0','?limit=1000','?recipientUserId='+other.id,'?status=READ&status=UNREAD'])assert.equal((await get(owner,'/api/notices'+suffix)).status,422);
  assert.equal((await read(owner,'invalid')).status,422);assert.equal((await read(owner,randomUUID())).status,404);pass('invalid filters and identifiers are rejected');
  await db.query(fs.readFileSync(path.join(__dirname,'../../database/010_notices.sql'),'utf8'));assert.equal((await get(owner,'/api/notices?status=READ')).body.meta.total,1);pass('migration rerun preserves notices and read state');
  const failedPublication=await publication(),original=Notice.create;
  try{Notice.create=async()=>{throw Error('Injected notice failure');};assert.equal((await accept(failedPublication)).status,500);}finally{Notice.create=original;}
  const [state]=await db.execute('SELECT status FROM Publication WHERE internalUUID=?',[failedPublication]);assert.equal(state[0].status,'disponible');assert.equal((await get(owner)).body.meta.total,3);pass('notice failure rolls back acceptance');
  const retried=await accept(failedPublication);assert.equal(retried.status,201);const retryUUID=retried.body.data.reservationUUID;await db.execute('UPDATE CollectionReservation SET scheduledAt=?,expiresAt=? WHERE internalUUID=?',[new Date(Date.now()-60000),new Date(Date.now()+3600000),retryUUID]);
  let calls=0;try{Notice.create=async(...args)=>{if(++calls===3)throw Error('Injected partial notice failure');return original(...args);};assert.equal((await request(app).post(`/api/collections/reservations/${retryUUID}/confirm`).auth(collector.token,{type:'bearer'})).status,500);}finally{Notice.create=original;}
  const [rollback]=await db.execute('SELECT status FROM CollectionReservation WHERE internalUUID=?',[retryUUID]);assert.equal(rollback[0].status,'ACEPTADA');const [awards]=await db.execute('SELECT COUNT(*) AS total FROM CollectionPointAward A JOIN CollectionReservation R ON A.reservationId=R.id WHERE R.internalUUID=?',[retryUUID]);assert.equal(Number(awards[0].total),0);assert.equal((await get(owner)).body.meta.total,4);pass('partial notice failure rolls back confirmation, awards and all confirmation notices');
  async function pending(){const person=await account('COMPANY','PENDING');await db.execute('INSERT INTO CompanyProfile (userId,taxIdentifier,contactName,coverageArea,documentContent,documentMime) VALUES (?,?,?,?,?,?)',[person.id,person.uuid,'Contacto','Centro',Buffer.from('document'),'application/pdf']);return person;}
  const approved=await pending(),rejected=await pending();const decide=(person,decision,reason)=>request(app).patch(`/api/admin/companies/${person.uuid}/decision`).auth(admin.token,{type:'bearer'}).send({decision,...(reason?{reason}:{})});
  assert.equal((await decide(approved,'APPROVED')).status,200);assert.equal((await get(approved)).body.data[0].kind,'APPROVED');assert.equal((await decide(approved,'APPROVED')).status,409);assert.equal((await get(approved)).body.meta.total,1);
  try{Notice.create=async()=>{throw Error('Injected decision notice failure');};assert.equal((await decide(rejected,'REJECTED','Documento incompleto')).status,500);}finally{Notice.create=original;}
  const [pendingState]=await db.execute('SELECT verificationStatus FROM User WHERE id=?',[rejected.id]);assert.equal(pendingState[0].verificationStatus,'PENDING');assert.equal((await get(rejected)).body.meta.total,0);
  assert.equal((await decide(rejected,'REJECTED','Documento incompleto')).status,200);assert.equal((await get(rejected)).body.data[0].body,'Documento incompleto');assert.equal((await get(other)).body.meta.total,0);pass('approval and private rejection notices; decision rollback and duplicate protection');
  const login=await request(app).post('/api/auth/login').send({email:rejected.email,password});assert.equal(login.status,200);rejected.token=login.body.data.tokens.accessToken;
  assert.equal((await get(rejected,'/api/auth/me')).body.data.verificationStatus,'REJECTED');assert.equal((await get(rejected,'/api/notices/unread-count')).body.data.verificationStatus,'REJECTED');
  for(const url of ['/api/publications/me','/api/profile/me','/api/collections/agenda','/api/auth/dashboard/COMPANY'])assert.equal((await get(rejected,url)).status,403);
  assert.equal((await read(rejected,(await get(rejected)).body.data[0].noticeUUID)).status,200);
  const refresh=await request(app).post('/api/auth/refresh').send({userUUID:rejected.uuid,refreshToken:login.body.data.tokens.refreshToken});assert.equal(refresh.status,200);rejected.token=refresh.body.data.tokens.accessToken;
  assert.equal((await request(app).post('/api/auth/logout').auth(rejected.token,{type:'bearer'})).status,200);assert.equal((await get(rejected)).status,401);pass('rejected company can log in, read, refresh and log out; business actions remain forbidden');
  await db.execute('UPDATE User SET accountStatus=? WHERE id=?',['SUSPENDED',owner.id]);assert.equal((await get(owner)).status,403);assert.equal((await read(owner,notice.noticeUUID)).status,403);await db.execute('UPDATE User SET accountStatus=?,tokenVersion=tokenVersion+1 WHERE id=?',['ACTIVE',owner.id]);assert.equal((await get(owner)).status,401);pass('suspension and token revocation apply to inbox');
  console.log(`${checks} notice scenarios passed.`);
 }finally{await pool.end();if(created&&/^ecorecicla_test_[a-f0-9]{16}$/.test(name))await db.query(`DROP DATABASE ${name}`);await db.end();}
})().catch(error=>{console.error(error);process.exitCode=1;});
