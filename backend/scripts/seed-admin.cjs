const {randomBytes,randomUUID}=require('node:crypto');
const fs=require('node:fs');const path=require('node:path');
const {pool}=require('../src/config/database');const User=require('../src/models/User');
const {hashPassword}=require('../src/services/passwordService');
(async()=>{
 const email=(process.env.ADMIN_EMAIL||'admin@ecorecicla.local').toLowerCase();
 if(await User.findByEmail(email)){console.log('Administrator email already exists; no changes.');return;}
 const password=process.env.ADMIN_PASSWORD||`Eco1-${randomBytes(18).toString('base64url')}`;
 const connection=await pool.getConnection();try{await connection.beginTransaction();await User.create({userUUID:randomUUID(),displayName:'Administración EcoRecicla',email,passwordHash:await hashPassword(password),roleCode:'ADMIN',verificationDocumentKey:null},connection);await connection.commit();}
 catch(error){await connection.rollback();throw error;}finally{connection.release();}
 const directory=path.resolve(__dirname,'../.local');fs.mkdirSync(directory,{recursive:true});
 fs.writeFileSync(path.join(directory,'initial-admin.txt'),`Email: ${email}\nPassword: ${password}\n`,{mode:0o600,flag:'wx'});
 console.log('Administrator created. Credentials saved locally to backend/.local/initial-admin.txt (excluded from Git).');
})().catch(error=>{console.error('Seed failed:',error.code||error.message);process.exitCode=1;}).finally(()=>pool.end());
