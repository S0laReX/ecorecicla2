const fs=require('node:fs');
const path=require('node:path');
const {createPrivateKey,createPublicKey}=require('node:crypto');

/** @param {NodeJS.ProcessEnv} [env] @returns {number|false} */
function trustProxyHops(env=process.env){
 const value=env.TRUST_PROXY_HOPS||'0';
 if(!/^\d+$/.test(value)||Number(value)>10)throw new Error('TRUST_PROXY_HOPS must be an integer from 0 to 10');
 return Number(value)||false;
}

/** Validate required deployment settings before opening the HTTP listener.
 * @param {NodeJS.ProcessEnv} [env]
 */
function serverConfig(env=process.env){
 for(const name of ['DB_HOST','DB_NAME','DB_USER','DB_PASSWORD','JWT_PUBLIC_KEY','JWT_ISSUER','JWT_AUDIENCE']){
  if(!env[name])throw new Error(`Missing required configuration: ${name}`);
 }
 const port=Number(env.PORT||4000);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid PORT');
 trustProxyHops(env);
 const production=env.NODE_ENV==='production';
 if(production){
  let origin;
  try{origin=new URL(env.FRONTEND_ORIGIN||'');}catch{throw new Error('FRONTEND_ORIGIN must be an HTTPS origin');}
  if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash){
   throw new Error('FRONTEND_ORIGIN must be an HTTPS origin');
  }
 }
 try{
  const privateKey=createPrivateKey(fs.readFileSync(env.JWT_PRIVATE_KEY_PATH||path.resolve(__dirname,'../../.keys/jwt-private.pem')));
  const publicKey=createPublicKey((env.JWT_PUBLIC_KEY||'').replace(/\\n/g,'\n'));
  if(privateKey.asymmetricKeyType!=='rsa'||(privateKey.asymmetricKeyDetails?.modulusLength||0)<2048||
   !createPublicKey(privateKey).export({type:'spki',format:'der'}).equals(publicKey.export({type:'spki',format:'der'}))){
   throw new Error('Invalid key pair');
  }
 }catch{throw new Error('JWT keys must be a matching RSA pair of at least 2048 bits; check JWT_PRIVATE_KEY_PATH and JWT_PUBLIC_KEY');}
 return {port,host:env.HOST||(production?'0.0.0.0':'127.0.0.1')};
}
module.exports={serverConfig,trustProxyHops};
