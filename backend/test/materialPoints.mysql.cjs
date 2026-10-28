// Integration tests use an isolated random database; application data is never modified.
const fs=require('node:fs'),path=require('node:path'),{randomUUID,randomBytes}=require('node:crypto');
const assert=require('node:assert/strict'),mysql=require('mysql2/promise'),request=require('supertest'),sharp=require('sharp');
const databaseName=`ecorecicla_test_${randomBytes(8).toString('hex')}`;
process.env.DB_NAME=databaseName;process.env.NODE_ENV='test';
const app=require('../src/app'),{pool}=require('../src/config/database'),{hashPassword}=require('../src/services/passwordService');
let checks=0;const passed=label=>console.log(`PASS ${++checks} ${label}`);
(async()=>{
 const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,multipleStatements:true,timezone:'Z'});let created=false;
 try{
  assert.match(databaseName,/^ecorecicla_test_[a-f0-9]{16}$/);await db.query(`CREATE DATABASE ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);created=true;await db.changeUser({database:databaseName});
  for(const file of ['001_sprint1.sql','002_accounts.sql','003_company_verification.sql','004_collection_reservations.sql','010_notices.sql'])await db.query(fs.readFileSync(path.join(__dirname,'../../database',file),'utf8'));
  await require('../scripts/migrate-confirmation.cjs')(db);
  const migrate=()=>db.query(fs.readFileSync(path.join(__dirname,'../../database/008_material_point_settings.sql'),'utf8'));await migrate();await migrate();
  const password='MaterialPointsTest2026',hash=await hashPassword(password);
  async function account(role,verification){const email=`${randomUUID()}@example.test`;const [row]=await db.execute('INSERT INTO User (internalUUID,displayName,email,passwordHash,roleCode,verificationStatus,verificationDocumentKey) VALUES (?,?,?,?,?,?,?)',[randomUUID(),`Test ${role}`,email,hash,role,verification,role==='COMPANY'?randomUUID():null]);const login=await request(app).post('/api/auth/login').send({email,password});assert.equal(login.status,200);return {id:row.insertId,token:login.body.data.tokens.accessToken};}
  const admin=await account('ADMIN','NOT_REQUIRED'),admin2=await account('ADMIN','NOT_REQUIRED'),owner=await account('USER','NOT_REQUIRED'),company=await account('COMPANY','APPROVED');
  const route='/api/admin/material-points';
  const list=(token=admin.token)=>request(app).get(route).auth(token,{type:'bearer'});
  const save=(material,values,token=admin.token)=>request(app).put(`${route}/${material}`).auth(token,{type:'bearer'}).send(values);
  assert.equal((await request(app).get(route)).status,401);assert.equal((await request(app).put(`${route}/papel`).send({publisherPoints:1,collectorPoints:2})).status,401);
  for(const user of [owner,company]){assert.equal((await list(user.token)).status,403);assert.equal((await save('papel',{publisherPoints:1,collectorPoints:2},user.token)).status,403);}passed('read and write require an administrator session');
  const initial=await list();assert.equal(initial.status,200);assert.equal(initial.body.data.length,5);assert.ok(initial.body.data.every(x=>x.publisherPoints===10&&x.collectorPoints===10&&x.isDefault));passed('all five unconfigured materials expose defaults');
  for(const values of [{publisherPoints:-1,collectorPoints:1},{publisherPoints:1.5,collectorPoints:1},{publisherPoints:'5',collectorPoints:1},{publisherPoints:null,collectorPoints:1},{publisherPoints:1},{publisherPoints:1000001,collectorPoints:1},{publisherPoints:1,collectorPoints:1,extra:true}])assert.equal((await save('papel',values)).status,422);
  assert.equal((await save('carton',{publisherPoints:1,collectorPoints:1})).status,422);assert.ok((await list()).body.data.every(x=>x.isDefault));passed('invalid numbers, missing values, extra fields and unknown materials do not mutate settings');
  const jpeg=await sharp({create:{width:16,height:16,channels:3,background:'#006c49'}}).jpeg().toBuffer();
  async function reservation(material){const [p]=await db.execute('INSERT INTO Publication (internalUUID,ownerId,materialType,quantityKg,locationText,availabilityText,photoJpeg,status) VALUES (?,?,?,?,?,?,?,?)',[randomUUID(),owner.id,material,'2.000','Zona QA','Lunes a domingo de 00:00 a 23:59',jpeg,'aceptada']);const uuid=randomUUID();const [r]=await db.execute('INSERT INTO CollectionReservation (internalUUID,publicationId,companyUserId,scheduledAt,expiresAt) VALUES (?,?,?,?,?)',[uuid,p.insertId,company.id,new Date(Date.now()-60000),new Date(Date.now()+600000)]);return {uuid,id:r.insertId};}
  const confirm=r=>request(app).post(`/api/collections/reservations/${r.uuid}/confirm`).auth(company.token,{type:'bearer'});
  const awards=async r=>(await db.execute('SELECT recipientRole,points FROM CollectionPointAward WHERE reservationId=? ORDER BY recipientRole',[r.id]))[0];
  const old=await reservation('papel');assert.equal((await confirm(old)).status,200);assert.ok((await awards(old)).every(x=>x.points===10));
  const pending=await reservation('papel');assert.equal((await save('papel',{publisherPoints:0,collectorPoints:37})).status,200);await migrate();
  const current=(await list()).body.data.find(x=>x.materialType==='papel');assert.deepEqual(current,{materialType:'papel',publisherPoints:0,collectorPoints:37,isDefault:false});
  const updated=await confirm(pending);assert.equal(updated.status,200);assert.equal(updated.body.data.publisherPoints,0);assert.equal(updated.body.data.collectorPoints,37);assert.deepEqual(await awards(pending),[{recipientRole:'COLLECTOR',points:37},{recipientRole:'PUBLISHER',points:0}]);
  assert.ok((await awards(old)).every(x=>x.points===10));assert.equal((await confirm(pending)).status,409);passed('saved values survive migration, affect pending confirmations, allow zero and preserve historical awards');
  for(const material of ['plastico','vidrio','metal','organico']){const r=await reservation(material);const response=await confirm(r);assert.equal(response.status,200);assert.equal(response.body.data.publisherPoints,10);assert.equal(response.body.data.collectorPoints,10);}passed('unconfigured materials still award default points');
  assert.equal((await save('papel',{publisherPoints:1000000,collectorPoints:1000000})).status,200);const max=await reservation('papel');assert.equal((await confirm(max)).status,200);assert.ok((await awards(max)).every(x=>x.points===1000000));passed('maximum supported values persist and can be awarded');
  await save('metal',{publisherPoints:11,collectorPoints:22});const race=await reservation('metal');
  const concurrent=await Promise.all([save('metal',{publisherPoints:33,collectorPoints:44},admin2.token),confirm(race)]);assert.ok(concurrent.every(x=>x.status===200));const pair=concurrent[1].body.data;assert.ok((pair.publisherPoints===11&&pair.collectorPoints===22)||(pair.publisherPoints===33&&pair.collectorPoints===44));passed('concurrent configuration and confirmation never mix participant values');
  await db.execute('UPDATE User SET accountStatus=? WHERE id=?',['SUSPENDED',admin.id]);assert.equal((await list()).status,403);assert.equal((await save('papel',{publisherPoints:1,collectorPoints:1})).status,403);
  await request(app).post('/api/auth/logout').auth(admin2.token,{type:'bearer'});assert.equal((await list(admin2.token)).status,401);assert.equal((await save('papel',{publisherPoints:1,collectorPoints:1},admin2.token)).status,401);passed('suspended administrators and revoked sessions cannot access settings');
  console.log(`${checks} material point scenarios passed.`);
 }finally{await pool.end();if(created&&/^ecorecicla_test_[a-f0-9]{16}$/.test(databaseName))await db.query(`DROP DATABASE ${databaseName}`);await db.end();}
})().catch(error=>{console.error(error);process.exitCode=1;});
