// Isolated database: never modify application or Clever Cloud records.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {randomUUID,randomBytes}=require('node:crypto');
const mysql=require('mysql2/promise');
const Company=require('../src/models/CompanyProfile');
const {databaseOptions}=require('../src/config/databaseOptions');
const name='ecorecicla_test_'+randomBytes(8).toString('hex');
(async()=>{
 const options={...databaseOptions(),multipleStatements:true,charset:'utf8mb4'};delete options.database;
 const db=await mysql.createConnection(options);let created=false;
 try{
  assert.match(name,/^ecorecicla_test_[a-f0-9]{16}$/);
  await db.query(`CREATE DATABASE ${name} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);created=true;
  await db.changeUser({database:name});
  for(const file of fs.readdirSync(path.join(__dirname,'../../database')).filter(f=>/^\d{3}_.*\.sql$/.test(f)).sort()){
   await db.query(fs.readFileSync(path.join(__dirname,'../../database',file),'utf8'));
  }
  async function company(label,tax,status='PENDING'){
   const uuid=randomUUID();const [user]=await db.execute('INSERT INTO User (internalUUID,roleCode,displayName,email,passwordHash,verificationStatus,verificationDocumentKey) VALUES (?,?,?,?,?,?,?)',
    [uuid,'COMPANY',label,uuid+'@example.test','unused-test-hash',status,randomUUID()]);
   await db.execute('INSERT INTO CompanyProfile (userId,taxIdentifier,contactName,coverageArea,documentContent,documentMime) VALUES (?,?,?,?,?,?)',
    [user.insertId,tax,'Contacto QA','Centro',Buffer.from('test'),'application/pdf']);return uuid;
  }
  const first=await company('Recicladora Ñandú','ECO-2026');
  const second=await company('Acopio del Norte','NIT-0002');
  await company('Empresa aprobada','APROBADA-01','APPROVED');
  async function check(search,expected){
   const count=await Company.readPendingCount(search,db),rows=await Company.findPending(search,1,10,db);
   assert.equal(count,expected.length);assert.deepEqual(new Set(rows.map(row=>row.companyUUID)),new Set(expected));
  }
  await check('',[first,second]);await check('Ñandú',[first]);await check('ECO-2026',[first]);await check('NIT-0002',[second]);
  await check('不存在',[]);await check("' OR 1=1 --",[]);await check('aprobada',[]);
  const pages=[...(await Company.findPending('',1,1,db)),...(await Company.findPending('',2,1,db))];
  assert.equal(new Set(pages.map(row=>row.companyUUID)).size,2);
  console.log('PASS pending company search: empty, accented name, ASCII NIT, Unicode, SQL injection, status and pagination');
 }finally{if(created)await db.query(`DROP DATABASE ${name}`);await db.end();}
})().catch(error=>{console.error('Company search test failed:',error.code||error.message);process.exitCode=1;});
