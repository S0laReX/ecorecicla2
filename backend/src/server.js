const app = require('./app');
for (const name of ['DB_HOST','DB_NAME','DB_USER','DB_PASSWORD','JWT_PUBLIC_KEY','JWT_ISSUER','JWT_AUDIENCE']) {
  if (!process.env[name]) throw new Error(`Missing required configuration: ${name}`);
}
const server = app.listen(Number(process.env.PORT || 4000),'127.0.0.1');
server.on('listening',()=>{console.log(`EcoRecicla API: http://127.0.0.1:${process.env.PORT||4000}`);});
server.on('error',error=>{console.error('No se pudo iniciar la API:',/** @type {NodeJS.ErrnoException} */(error).code);process.exitCode=1;});
server.requestTimeout = 30000;
server.headersTimeout = 15000;
const {pool}=require('./config/database');
const stopExpiryWorker=require('./services/collectionExpiryService').startExpiryWorker();
/** CLOSE HTTP AND DATABASE RESOURCES @returns {void} */
function shutdown(){stopExpiryWorker();server.close(()=>{void pool.end();});}
process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
