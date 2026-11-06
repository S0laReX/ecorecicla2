const {serverConfig}=require('./config/runtime');
const {host,port}=serverConfig();
const app = require('./app');
const server = app.listen(port,host);
server.on('listening',()=>{console.log(`EcoRecicla API listening on ${host}:${port}`);});
server.on('error',error=>{console.error('No se pudo iniciar la API:',/** @type {NodeJS.ErrnoException} */(error).code);process.exitCode=1;});
server.requestTimeout = 30000;
server.headersTimeout = 15000;
const {pool}=require('./config/database');
const stopExpiryWorker=require('./services/collectionExpiryService').startExpiryWorker();
let stopping=false;
/** CLOSE HTTP AND DATABASE RESOURCES @returns {void} */
function shutdown(){
 if(stopping)return;
 stopping=true;app.locals.shuttingDown=true;stopExpiryWorker();
 const deadline=setTimeout(()=>{console.error('API shutdown timed out');process.exit(1);},10000);deadline.unref();
 server.close(()=>{void pool.end().catch(()=>{process.exitCode=1;}).finally(()=>clearTimeout(deadline));});
}
process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
