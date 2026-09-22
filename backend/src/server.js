const app = require('./app');
for (const name of ['DB_HOST','DB_NAME','DB_USER','DB_PASSWORD','JWT_PUBLIC_KEY','JWT_ISSUER','JWT_AUDIENCE']) {
  if (!process.env[name]) throw new Error(`Missing required configuration: ${name}`);
}
const server = app.listen(Number(process.env.PORT || 4000),'127.0.0.1');
server.requestTimeout = 30000;
server.headersTimeout = 15000;
