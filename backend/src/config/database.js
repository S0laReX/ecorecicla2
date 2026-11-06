const mysql = require('mysql2/promise');
const {databaseOptions}=require('./databaseOptions');
exports.pool = mysql.createPool({...databaseOptions(),
  timezone:'Z',charset:'utf8mb4',connectionLimit:10,queueLimit:50,connectTimeout:10000,
  supportBigNumbers:true,bigNumberStrings:true,multipleStatements:false});
