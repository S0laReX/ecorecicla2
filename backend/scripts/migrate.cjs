const fs=require('node:fs');
const path=require('node:path');
const mysql=require('mysql2/promise');
// Scripts are trusted repository files, never client supplied SQL.
(async()=>{
 const connection=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,multipleStatements:true,timezone:'Z'});
 try {
  const [tables]=await connection.execute('SELECT TABLE_NAME AS tableName FROM information_schema.tables WHERE TABLE_SCHEMA = DATABASE()');
  const names=tables.map(row=>row.tableName.toLowerCase());
  const existing=['user','role','publication'].filter(name=>names.includes(name));
  if(existing.length!==0 && existing.length!==3)throw new Error('Partial base schema; repair manually before migrating.');
  if(existing.length===0)await connection.query(fs.readFileSync(path.resolve(__dirname,'../../database/001_sprint1.sql'),'utf8'));
  await connection.query(fs.readFileSync(path.resolve(__dirname,'../../database/002_accounts.sql'),'utf8'));
  await connection.query(fs.readFileSync(path.resolve(__dirname,'../../database/003_company_verification.sql'),'utf8'));
  await connection.query(fs.readFileSync(path.resolve(__dirname,'../../database/004_collection_reservations.sql'),'utf8'));
  await require('./migrate-confirmation.cjs')(connection);
  await connection.query(fs.readFileSync(path.resolve(__dirname,'../../database/006_collection_ratings.sql'),'utf8'));
  await connection.query(fs.readFileSync(path.resolve(__dirname,'../../database/007_account_status_audit.sql'),'utf8'));
  await connection.query(fs.readFileSync(path.resolve(__dirname,'../../database/008_material_point_settings.sql'),'utf8'));
  await connection.query(fs.readFileSync(path.resolve(__dirname,'../../database/009_account_profile.sql'),'utf8'));
  await connection.query(fs.readFileSync(path.resolve(__dirname,'../../database/010_notices.sql'),'utf8'));
  console.log('Schema ready. Existing accounts and publications preserved.');
 } finally {await connection.end();}
})().catch(error=>{console.error('Migration failed:',error.code || error.message);process.exitCode=1;});
