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
  for(const file of ['001_sprint1.sql','002_accounts.sql','003_company_verification.sql','004_collection_reservations.sql','010_notices.sql'])await db.query(fs.readFileSync(path.join(__dirname,'../../database',file),'utf8'));
  await require('../scripts/migrate-confirmation.cjs')(db);for(const file of ['006_collection_ratings.sql','007_account_status_audit.sql'])await db.query(fs.readFileSync(path.join(__dirname,'../../database',file),'utf8'));
  const password='AdminAccountsTest2026';const hash=await hashPassword(password);
  async function account(role,verification){const userUUID=randomUUID();const email=`${userUUID}@example.test`;const [row]=await db.execute('INSERT INTO User (internalUUID,displayName,email,passwordHash,roleCode,verificationStatus,verificationDocumentKey) VALUES (?,?,?,?,?,?,?)',[userUUID,`Test ${role}`,email,hash,role,verification,role==='COMPANY'?randomUUID():null]);const login=await request(app).post('/api/auth/login').send({email,password});assert.equal(login.status,200);return {id:row.insertId,userUUID,email,token:login.body.data.tokens.accessToken,refreshToken:login.body.data.tokens.refreshToken};}
  const admin=await account('ADMIN','NOT_REQUIRED');const owner=await account('USER','NOT_REQUIRED');const company=await account('COMPANY','APPROVED');const pendingCompany=await account('COMPANY','PENDING');const otherAdmin=await account('ADMIN','NOT_REQUIRED');
  const ownerSecondLogin=await request(app).post('/api/auth/login').send({email:owner.email,password});assert.equal(ownerSecondLogin.status,200);const ownerSecondToken=ownerSecondLogin.body.data.tokens.accessToken;const ownerSecondRefresh=ownerSecondLogin.body.data.tokens.refreshToken;
  const route='/api/admin/accounts';assert.equal((await request(app).get(route)).status,401);assert.equal((await request(app).get(route).auth(owner.token,{type:'bearer'})).status,403);passed('account listing requires a current administrator session');
  const all=await request(app).get(route).auth(admin.token,{type:'bearer'});assert.equal(all.status,200);assert.equal(all.body.meta.total,3);assert.ok(all.body.data.every(item=>item.roleCode==='USER'||item.roleCode==='COMPANY'));assert.ok(all.body.data.some(item=>item.userUUID===pendingCompany.userUUID&&item.status==='PENDING'));assert.ok(all.body.data.some(item=>item.userUUID===company.userUUID&&item.status==='APPROVED'));
  const pending=await request(app).get(`${route}?status=PENDING`).auth(admin.token,{type:'bearer'});assert.equal(pending.body.meta.total,1);assert.equal(pending.body.data[0].userUUID,pendingCompany.userUUID);
  const active=await request(app).get(`${route}?status=ACTIVE&search=${encodeURIComponent(owner.email)}`).auth(admin.token,{type:'bearer'});assert.equal(active.body.meta.total,1);assert.equal(active.body.data[0].userUUID,owner.userUUID);
  assert.equal((await request(app).get(`${route}?status=DROP%20TABLE`).auth(admin.token,{type:'bearer'})).status,422);passed('listing returns only users and companies, state filters and search are validated');
  const jpeg=await sharp({create:{width:16,height:16,channels:3,background:'#006c49'}}).jpeg().toBuffer();
  const [publication]=await db.execute('INSERT INTO Publication (internalUUID,ownerId,materialType,quantityKg,locationText,availabilityText,photoJpeg,status) VALUES (?,?,?,?,?,?,?,?)',[randomUUID(),owner.id,'plastico','2.000','Zona centro','Lunes a domingo de 00:00 a 23:59',jpeg,'aceptada']);
  const reservationUUID=randomUUID();await db.execute('INSERT INTO CollectionReservation (internalUUID,publicationId,companyUserId,scheduledAt,expiresAt,status) VALUES (?,?,?,?,?,?)',[reservationUUID,publication.insertId,company.id,new Date(Date.now()-60000),new Date(Date.now()+3600000),'ACEPTADA']);
  const targetRoute=userUUID=>`${route}/${userUUID}/status`;
  assert.equal((await request(app).patch(targetRoute(owner.userUUID)).auth(owner.token,{type:'bearer'}).send({status:'SUSPENDED'})).status,403);
  assert.equal((await request(app).patch(targetRoute(owner.userUUID)).auth(admin.token,{type:'bearer'}).send({status:'LOCKED'})).status,422);
  assert.equal((await request(app).patch(targetRoute(admin.userUUID)).auth(admin.token,{type:'bearer'}).send({status:'SUSPENDED'})).status,404);
  assert.equal((await request(app).patch(targetRoute(owner.userUUID)).auth(admin.token,{type:'bearer'}).send({status:'SUSPENDED',reason:'unexpected'})).status,422);
  const suspended=await request(app).patch(targetRoute(owner.userUUID)).auth(admin.token,{type:'bearer'}).send({status:'SUSPENDED'});assert.equal(suspended.status,200);assert.equal(suspended.body.data.previousStatus,'ACTIVE');assert.equal(suspended.body.data.accountStatus,'SUSPENDED');assert.ok(suspended.body.data.changedAt);
  const [audit]=await db.execute('SELECT actorAdminId,targetUserId,previousStatus,newStatus,createdAt FROM AccountStatusAudit WHERE targetUserId=?',[owner.id]);assert.equal(audit.length,1);assert.equal(Number(audit[0].actorAdminId),Number(admin.id));assert.equal(audit[0].previousStatus,'ACTIVE');assert.equal(audit[0].newStatus,'SUSPENDED');
  const [history]=await db.execute('SELECT P.status AS publicationStatus,C.status AS reservationStatus FROM Publication P JOIN CollectionReservation C ON C.publicationId=P.id WHERE P.id=?',[publication.insertId]);assert.deepEqual(history[0],{publicationStatus:'aceptada',reservationStatus:'ACEPTADA'});
  assert.equal((await request(app).get('/api/auth/me').auth(owner.token,{type:'bearer'})).body.errorCode,'ACCOUNT_SUSPENDED');
  assert.equal((await request(app).get('/api/auth/me').auth(ownerSecondToken,{type:'bearer'})).body.errorCode,'ACCOUNT_SUSPENDED');
  assert.equal((await request(app).get('/api/publications/me').auth(owner.token,{type:'bearer'})).body.errorCode,'ACCOUNT_SUSPENDED');
  assert.equal((await request(app).get('/api/ratings/pending').auth(owner.token,{type:'bearer'})).body.errorCode,'ACCOUNT_SUSPENDED');
  assert.equal((await request(app).get('/api/ratings/me').auth(owner.token,{type:'bearer'})).body.errorCode,'ACCOUNT_SUSPENDED');
  assert.equal((await request(app).post('/api/auth/refresh').send({refreshToken:owner.refreshToken,userUUID:owner.userUUID})).body.errorCode,'ACCOUNT_SUSPENDED');
  assert.equal((await request(app).post('/api/auth/refresh').send({refreshToken:ownerSecondRefresh,userUUID:owner.userUUID})).body.errorCode,'ACCOUNT_SUSPENDED');
  const blockedPublication=await request(app).post('/api/publications').auth(owner.token,{type:'bearer'}).field({materialType:'plastico',quantityKg:'1.000',locationText:'Zona centro',availabilityText:'Lunes 09:00 a 12:00'}).attach('photo',jpeg,'material.jpg');assert.equal(blockedPublication.body.errorCode,'ACCOUNT_SUSPENDED');
  assert.equal((await request(app).get(`${route}?status=SUSPENDED`).auth(admin.token,{type:'bearer'})).body.meta.total,1);passed('suspension immediately blocks existing sessions and preserves publication and reservation history; audit records actor and time');
  const suspendedCompany=await request(app).patch(targetRoute(company.userUUID)).auth(admin.token,{type:'bearer'}).send({status:'SUSPENDED'});assert.equal(suspendedCompany.status,200);
  assert.equal((await request(app).post(`/api/collections/publications/${randomUUID()}/accept`).auth(company.token,{type:'bearer'}).send({scheduledAt:new Date(Date.now()+60000).toISOString()})).body.errorCode,'ACCOUNT_SUSPENDED');
  const reactivated=await request(app).patch(targetRoute(owner.userUUID)).auth(admin.token,{type:'bearer'}).send({status:'ACTIVE'});assert.equal(reactivated.status,200);assert.equal(reactivated.body.data.previousStatus,'SUSPENDED');
  assert.equal((await request(app).get('/api/auth/me').auth(owner.token,{type:'bearer'})).body.errorCode,'SESSION_INVALID');
  assert.equal((await request(app).get('/api/auth/me').auth(ownerSecondToken,{type:'bearer'})).body.errorCode,'SESSION_INVALID');
  assert.equal((await request(app).post('/api/auth/refresh').send({refreshToken:owner.refreshToken,userUUID:owner.userUUID})).body.errorCode,'SESSION_INVALID');
  const newLogin=await request(app).post('/api/auth/login').send({email:owner.email,password});assert.equal(newLogin.status,200);
  assert.equal((await request(app).patch(targetRoute(owner.userUUID)).auth(admin.token,{type:'bearer'}).send({status:'ACTIVE'})).status,409);
  const [auditTrail]=await db.execute('SELECT previousStatus,newStatus FROM AccountStatusAudit WHERE targetUserId=? ORDER BY id',[owner.id]);assert.deepEqual(auditTrail.map(row=>[row.previousStatus,row.newStatus]),[['ACTIVE','SUSPENDED'],['SUSPENDED','ACTIVE']]);
  const [historyAfter]=await db.execute('SELECT COUNT(*) AS count FROM CollectionReservation WHERE internalUUID=?',[reservationUUID]);assert.equal(Number(historyAfter[0].count),1);passed('reactivation permits a new login, keeps old sessions revoked, and records both state transitions');
  console.log(`${checks} account administration scenarios passed.`);
 }finally{await pool.end();if(created&&/^ecorecicla_test_[a-f0-9]{16}$/.test(databaseName))await db.query(`DROP DATABASE ${databaseName}`);await db.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
