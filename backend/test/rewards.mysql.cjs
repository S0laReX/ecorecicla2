// All data lives in a randomly named temporary database, removed on completion.
const fs=require('node:fs'),path=require('node:path'),{randomUUID,randomBytes}=require('node:crypto');
const assert=require('node:assert/strict'),mysql=require('mysql2/promise'),request=require('supertest');
const databaseName=`ecorecicla_test_${randomBytes(8).toString('hex')}`;
process.env.DB_NAME=databaseName;process.env.NODE_ENV='test';
const app=require('../src/app'),{pool}=require('../src/config/database'),{hashPassword}=require('../src/services/passwordService');
const Redemption=require('../src/models/RewardRedemption');
let checks=0;const pass=label=>console.log(`PASS ${++checks} ${label}`);
(async()=>{
 const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,multipleStatements:true,timezone:'Z'});let created=false;
 try{
  assert.match(databaseName,/^ecorecicla_test_[a-f0-9]{16}$/);await db.query(`CREATE DATABASE ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);created=true;await db.changeUser({database:databaseName});
  for(const file of ['001_sprint1.sql','002_accounts.sql','003_company_verification.sql','004_collection_reservations.sql','005_collection_confirmation.sql','006_collection_ratings.sql','007_account_status_audit.sql','008_material_point_settings.sql','009_account_profile.sql','010_notices.sql','011_rewards.sql'])await db.query(fs.readFileSync(path.join(__dirname,'../../database',file),'utf8'));
  const migrate=()=>db.query(fs.readFileSync(path.join(__dirname,'../../database/011_rewards.sql'),'utf8'));await migrate();
  const password='RewardsTesting2026',hash=await hashPassword(password);
  async function account(role,verification=role==='COMPANY'?'APPROVED':'NOT_REQUIRED'){
   const uuid=randomUUID(),email=uuid+'@example.test';const [row]=await db.execute('INSERT INTO User (internalUUID,displayName,email,passwordHash,roleCode,verificationStatus,verificationDocumentKey) VALUES (?,?,?,?,?,?,?)',[uuid,`Cuenta ${role} ${uuid.slice(0,8)}`,email,hash,role,verification,role==='COMPANY'?randomUUID():null]);
   const login=await request(app).post('/api/auth/login').send({email,password});assert.equal(login.status,200);return {id:row.insertId,uuid,email,token:login.body.data.tokens.accessToken};
  }
  const admin=await account('ADMIN'),admin2=await account('ADMIN'),owner=await account('USER'),other=await account('USER'),poor=await account('USER'),company=await account('COMPANY'),company2=await account('COMPANY'),company3=await account('COMPANY'),pending=await account('COMPANY','PENDING');
  const get=(who,url)=>request(app).get('/api'+url).auth(who.token,{type:'bearer'});
  const catalog=(who=owner,query='')=>get(who,`/rewards${query}`);
  const history=(who=owner,query='')=>get(who,`/rewards/redemptions${query}`);
  const ranking=(who=company,query='?month=2026-09')=>get(who,`/rankings/companies${query}`);
  const input={name:'Botella reutilizable',description:'Recoger en recepción',pointsCost:30,stock:5,isActive:true};
  const create=(data=input,who=admin)=>request(app).post('/api/admin/rewards').auth(who.token,{type:'bearer'}).send(data);
  const update=(reward,changes={},who=admin)=>request(app).put(`/api/admin/rewards/${reward.rewardUUID}`).auth(who.token,{type:'bearer'}).send({...input,...reward,...changes,rewardUUID:undefined});
  const redeem=(reward,who=owner,key=randomUUID(),extra={})=>request(app).post(`/api/rewards/${reward.rewardUUID}/redeem`).auth(who.token,{type:'bearer'}).send({requestUUID:key,expectedPointsCost:reward.pointsCost,...extra});
  const deliver=(uuid,who=admin)=>request(app).post(`/api/admin/redemptions/${uuid}/deliver`).auth(who.token,{type:'bearer'}).send({});
  const stock=async reward=>Number((await db.execute('SELECT stock FROM Reward WHERE internalUUID=?',[reward.rewardUUID]))[0][0].stock);
  const reward=async data=>{const result=await create({...input,...data});assert.equal(result.status,201,JSON.stringify(result.body));return result.body.data;};
  async function collection(publisher,collector,publisherPoints=0,collectorPoints=0,at='2026-08-01 00:00:00.000',confirmed=true){
   const [p]=await db.execute('INSERT INTO Publication (internalUUID,ownerId,materialType,quantityKg,locationText,availabilityText,photoJpeg,status) VALUES (?,?,?,?,?,?,?,?)',[randomUUID(),publisher.id,'plastico','2.000','Zona QA','Lunes a domingo de 00:00 a 23:59',Buffer.from('fixture'),confirmed?'confirmada':'aceptada']);
   const uuid=randomUUID();const [r]=await db.execute('INSERT INTO CollectionReservation (internalUUID,publicationId,companyUserId,scheduledAt,expiresAt,status,confirmedAt) VALUES (?,?,?,?,?,?,?)',[uuid,p.insertId,collector.id,new Date(Date.now()-60000),new Date(Date.now()+3600000),confirmed?'CONFIRMADA':'ACEPTADA',confirmed?new Date(at+'Z'):null]);
   if(confirmed)for(const [recipient,role,points] of [[publisher,'PUBLISHER',publisherPoints],[collector,'COLLECTOR',collectorPoints]])await db.execute('INSERT INTO CollectionPointAward (internalUUID,reservationId,recipientUserId,recipientRole,points,createdAt) VALUES (?,?,?,?,?,?)',[randomUUID(),r.insertId,recipient.id,role,points,at]);
   return uuid;
  }
  for(const url of ['/api/rewards','/api/rewards/redemptions','/api/admin/rewards','/api/admin/redemptions','/api/rankings/companies'])assert.equal((await request(app).get(url)).status,401);
  assert.equal((await request(app).post(`/api/rewards/${randomUUID()}/redeem`).send({})).status,401);
  for(const who of [owner,company,pending]){assert.equal((await create(input,who)).status,403);assert.equal((await get(who,'/admin/rewards')).status,403);assert.equal((await get(who,'/admin/redemptions')).status,403);}
  for(const who of [admin,company,pending]){assert.equal((await catalog(who)).status,403);assert.equal((await history(who)).status,403);assert.equal((await redeem({rewardUUID:randomUUID(),pointsCost:30},who)).status,403);}
  assert.equal((await ranking(owner)).status,403);assert.equal((await ranking(pending)).status,403);pass('role and authentication checks protect all reward, redemption and ranking operations');
  assert.deepEqual((await catalog()).body.data.wallet,{earnedPoints:0,spentPoints:0,availablePoints:0});
  for(const changes of [{pointsCost:0},{pointsCost:1.1},{pointsCost:'30'},{stock:-1},{name:' '},{ownerId:owner.id},{isActive:'true'}])assert.equal((await create({...input,...changes})).status,422);
  const first=await reward({});assert.equal(Object.hasOwn(first,'rewardId'),false);
  assert.equal((await catalog()).body.data.items.length,1);
  assert.equal((await redeem(first)).body.errorCode,'INSUFFICIENT_POINTS');assert.equal(await stock(first),5);
  for(const extra of [{userId:other.id},{pointsCost:1},{quantity:2}])assert.equal((await redeem(first,owner,randomUUID(),extra)).status,422);
  for(const query of ['?page=0','?limit=51','?userId=1'])assert.equal((await catalog(owner,query)).status,422);pass('strict product and query validation, honest empty balance, and insufficient-point rejection');
  await collection(owner,company,100,17);await collection(other,company,100,0);
  const key=randomUUID();const redeemed=await redeem(first,owner,key);assert.equal(redeemed.status,200,JSON.stringify(redeemed.body));const original=redeemed.body.data.redemption;
  assert.deepEqual(redeemed.body.data.wallet,{earnedPoints:100,spentPoints:30,availablePoints:70});assert.equal(await stock(first),4);
  const duplicate=await redeem(first,owner,key);assert.equal(duplicate.body.data.redemption.redemptionUUID,original.redemptionUUID);assert.equal(await stock(first),4);
  const sameKey=await Promise.all([redeem(first,owner,key),redeem(first,owner,key)]);assert.ok(sameKey.every(r=>r.status===200));assert.equal((await history()).body.data.meta.total,1);
  assert.equal((await redeem(first,owner,key,{expectedPointsCost:31})).body.errorCode,'REDEMPTION_REQUEST_CONFLICT');
  assert.equal((await get(owner,'/profile/me')).body.data.summary.totalPoints,100);pass('canje debits available balance, preserves earned history, and repeated requests never debit twice');
  assert.equal((await update(first,{name:'Edición obsoleta'})).body.errorCode,'REWARD_CHANGED');
  const current=(await get(admin,'/admin/rewards')).body.data.items.find(r=>r.rewardUUID===first.rewardUUID);
  const changed=await update(current,{name:'Nuevo nombre',pointsCost:40});assert.equal(changed.status,200);const updated=changed.body.data;
  assert.equal((await redeem(first)).body.errorCode,'REWARD_CHANGED');assert.equal(await stock(first),4);
  const hidden=await update(updated,{isActive:false});assert.equal(hidden.status,200);assert.equal((await catalog()).body.data.items.length,0);assert.equal((await redeem(updated)).status,404);
  await migrate();assert.equal(await stock(first),4);assert.equal((await history()).body.data.items[0].rewardName,input.name);assert.equal((await history()).body.data.items[0].pointsCost,30);
  assert.equal((await redeem(first,owner,key)).body.data.redemption.redemptionUUID,original.redemptionUUID);pass('stale admin edits cannot restore consumed stock, price changes require review, and snapshots survive product edits and migration');
  assert.equal((await history(other)).body.data.meta.total,0);assert.equal((await get(admin,'/admin/redemptions?status=PENDING')).body.data.meta.total,1);
  assert.equal((await deliver(original.redemptionUUID,owner)).status,403);assert.equal((await deliver(original.redemptionUUID,company)).status,403);
  const delivered=await deliver(original.redemptionUUID);assert.equal(delivered.status,200);assert.ok(delivered.body.data.deliveredAt);
  assert.equal((await deliver(original.redemptionUUID,admin2)).body.data.deliveredAt,delivered.body.data.deliveredAt);
  assert.equal((await get(admin,'/admin/redemptions?status=PENDING')).body.data.meta.total,0);assert.equal((await history(owner,'?status=DELIVERED')).body.data.meta.total,1);assert.equal((await deliver(randomUUID())).status,404);
  assert.deepEqual((await catalog()).body.data.wallet,{earnedPoints:100,spentPoints:30,availablePoints:70});pass('history isolates users, delivery is admin-only and idempotent, and delivery never debits points again');
  const last=await reward({name:'Última unidad',pointsCost:10,stock:1});
  const race=await Promise.all([redeem(last,owner),redeem(last,other)]);assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);assert.equal(await stock(last),0);assert.equal(race.find(r=>r.status===409).body.errorCode,'REWARD_OUT_OF_STOCK');pass('competing users cannot both redeem the last unit');
  const walletUser=await account('USER');await collection(walletUser,company,100,0);const expensive1=await reward({pointsCost:60,stock:2}),expensive2=await reward({pointsCost:60,stock:2});
  const walletRace=await Promise.all([redeem(expensive1,walletUser),redeem(expensive2,walletUser)]);assert.deepEqual(walletRace.map(r=>r.status).sort(),[200,409]);assert.equal(walletRace.find(r=>r.status===409).body.errorCode,'INSUFFICIENT_POINTS');assert.equal((await catalog(walletUser)).body.data.wallet.availablePoints,40);pass('simultaneous canjes for different rewards cannot overspend a user balance');
  const retryUser=await account('USER');await collection(retryUser,company,100,0);const retryReward=await reward({pointsCost:10,stock:2}),retryKey=randomUUID();
  const parallel=await Promise.all([redeem(retryReward,retryUser,retryKey),redeem(retryReward,retryUser,retryKey)]);assert.ok(parallel.every(r=>r.status===200));assert.equal(parallel[0].body.data.redemption.redemptionUUID,parallel[1].body.data.redemption.redemptionUUID);assert.equal(await stock(retryReward),1);pass('simultaneous first attempts sharing a request key create exactly one redemption');
  const rollback=await reward({pointsCost:10,stock:1});const before=(await catalog(owner)).body.data.wallet;const createOriginal=Redemption.create;
  try{Redemption.create=async()=>{throw new Error('Injected failure');};assert.equal((await redeem(rollback)).status,500);}finally{Redemption.create=createOriginal;}
  assert.equal(await stock(rollback),1);assert.deepEqual((await catalog(owner)).body.data.wallet,before);assert.equal((await redeem(rollback)).status,200);pass('database failures roll back both inventory and points, allowing safe retries');
  const earnedUser=await account('USER');const freshCollection=await collection(earnedUser,company,0,0,'2026-08-01 00:00:00.000',false);
  assert.equal((await request(app).post(`/api/collections/reservations/${freshCollection}/confirm`).auth(company.token,{type:'bearer'}).send({})).status,200);
  const earnedReward=await reward({pointsCost:10,stock:1});assert.equal((await redeem(earnedReward,earnedUser)).status,200);assert.equal((await catalog(earnedUser)).body.data.wallet.availablePoints,0);pass('points awarded by the existing confirmation flow can immediately be redeemed');
  await collection(owner,company,0,999,'2026-09-01 03:59:59.999');
  await collection(owner,company,0,40,'2026-09-01 04:00:00.000');await collection(company,company2,10,50,'2026-09-30 23:00:00.000');
  await collection(owner,company,0,1000,'2026-10-01 04:00:00.000');await collection(owner,company3,0,20,'2026-10-01 03:59:59.999');await collection(owner,pending,0,500,'2026-09-15 12:00:00.000');
  const ranked=await ranking();assert.equal(ranked.status,200,JSON.stringify(ranked.body));assert.equal(ranked.body.data.timeZone,'America/La_Paz');
  assert.equal(ranked.body.data.meta.total,3);assert.deepEqual(ranked.body.data.items.map(r=>[r.points,r.position]),[[50,1],[50,1],[20,3]]);
  assert.equal(ranked.body.data.ownEntry.companyUUID,company.uuid);assert.equal(ranked.body.data.ownEntry.points,50);
  assert.equal((await ranking(admin)).body.data.ownEntry,null);
  const page1=(await ranking(company,'?month=2026-09&limit=1&page=1')).body.data,page2=(await ranking(company,'?month=2026-09&limit=1&page=2')).body.data;assert.notEqual(page1.items[0].companyUUID,page2.items[0].companyUUID);assert.equal(page1.meta.total,3);
  assert.equal((await ranking(company,'?month=2026-10')).body.data.ownEntry.points,1000);assert.equal((await ranking(company,'?month=2026-06')).body.data.items.length,0);
  for(const query of ['?month=2026-13','?month=2026-00','?month=2026-9','?month=2026-09&userId=1','?page=0'])assert.equal((await ranking(company,query)).status,422);pass('monthly ranking uses Bolivia month boundaries, includes both award roles, shares tie positions and paginates deterministically');
  await db.execute('UPDATE User SET accountStatus=? WHERE id=?',['SUSPENDED',company3.id]);assert.equal((await ranking()).body.data.meta.total,2);assert.equal((await ranking(company3)).status,403);
  await db.execute('UPDATE User SET accountStatus=? WHERE id=?',['SUSPENDED',owner.id]);assert.equal((await catalog()).status,403);assert.equal((await history()).status,403);assert.equal((await redeem(last)).status,403);
  await request(app).post('/api/auth/logout').auth(admin2.token,{type:'bearer'});assert.equal((await get(admin2,'/admin/rewards')).status,401);assert.equal((await create(input,admin2)).status,401);pass('suspended accounts and revoked sessions are rejected; inactive companies leave the ranking');
  console.log(`${checks} rewards and ranking scenarios passed.`);
 }finally{await pool.end();if(created&&/^ecorecicla_test_[a-f0-9]{16}$/.test(databaseName))await db.query(`DROP DATABASE ${databaseName}`);await db.end();}
})().catch(error=>{console.error(error);process.exitCode=1;});
