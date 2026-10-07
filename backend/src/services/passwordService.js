const {scrypt,randomBytes,timingSafeEqual}=require('node:crypto');
/** DERIVE PASSWORD KEY @param {string} password @param {string} salt @returns {Promise<Buffer>} */
function derive(password,salt){return new Promise((resolve,reject)=>scrypt(password,salt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key)));}
/** HASH PASSWORD WITH RANDOM SALT @param {string} password @returns {Promise<string>} */
async function hashPassword(password){const salt=randomBytes(16).toString('hex');return `scrypt$${salt}$${(await derive(password,salt)).toString('hex')}`;}
/** VERIFY PASSWORD IN CONSTANT TIME @param {string} password @param {string} encoded @returns {Promise<boolean>} */
async function verifyPassword(password,encoded){
 if(!/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(encoded))return false;
 const [,salt,expected]=encoded.split('$');return timingSafeEqual(await derive(password,salt),Buffer.from(expected,'hex'));
}
module.exports={hashPassword,verifyPassword};
