const fs=require('node:fs');

/** Shared TLS settings for application queries, migrations and admin seeding.
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {import('mysql2').ConnectionOptions}
 */
function databaseOptions(env=process.env){
 const port=Number(env.DB_PORT||3306);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid DB_PORT');
 if(env.DB_SSL&&!['true','false'].includes(env.DB_SSL))throw new Error('DB_SSL must be true or false');
 if(env.DB_SSL_CA_PATH&&env.DB_SSL!=='true')throw new Error('DB_SSL_CA_PATH requires DB_SSL=true');
 return {host:env.DB_HOST,port,user:env.DB_USER,password:env.DB_PASSWORD,database:env.DB_NAME,
  ...(env.DB_SSL==='true'?{ssl:{rejectUnauthorized:true,...(env.DB_SSL_CA_PATH?{ca:fs.readFileSync(env.DB_SSL_CA_PATH)}:{})}}:{})};
}
module.exports={databaseOptions};
