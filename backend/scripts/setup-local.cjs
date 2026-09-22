const fs=require('node:fs');const path=require('node:path');const {generateKeyPairSync,createPublicKey}=require('node:crypto');
const root=path.resolve(__dirname,'..');const envPath=path.join(root,'.env');
if(!fs.existsSync(envPath))fs.copyFileSync(path.join(root,'.env.example'),envPath);
let env=fs.readFileSync(envPath,'utf8');const directory=path.join(root,'.keys');fs.mkdirSync(directory,{recursive:true});
const privatePath=path.join(directory,'jwt-private.pem');const publicPath=path.join(directory,'jwt-public.pem');let publicKey;
if(fs.existsSync(privatePath))publicKey=createPublicKey(fs.readFileSync(privatePath)).export({type:'spki',format:'pem'}).toString();
else{
 if(/^JWT_PUBLIC_KEY=.+$/m.test(env))throw new Error('Existing public key without local private key. Configure its matching private key; do not replace an active key.');
 const pair=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
 fs.writeFileSync(privatePath,pair.privateKey,{mode:0o600,flag:'wx'});publicKey=pair.publicKey;
}
fs.writeFileSync(publicPath,publicKey);
const settings={JWT_PUBLIC_KEY:publicKey.trim().replace(/\r?\n/g,'\\n'),JWT_ISSUER:'ecorecicla-auth',JWT_AUDIENCE:'ecorecicla-api',JWT_PRIVATE_KEY_PATH:'.keys/jwt-private.pem',FRONTEND_ORIGIN:'http://localhost:3000',RECOVERY_DELIVERY:'local'};
for(const [key,value]of Object.entries(settings)){
 const regex=new RegExp('^'+key+'=(.*)$','m');const match=env.match(regex);
 if(key==='JWT_PUBLIC_KEY'||!match||!match[1])env=match?env.replace(regex,()=>key+'='+value):env+'\n'+key+'='+value+'\n';
}
fs.writeFileSync(envPath,env);console.log('Local RSA keys and .env ready. Configure DB_* before running migrate.');
