const mysql = require('mysql2/promise');
exports.pool = mysql.createPool({host:process.env.DB_HOST, port:Number(process.env.DB_PORT || 3306),
  user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,
  timezone:'Z',charset:'utf8mb4',connectionLimit:10,queueLimit:50,connectTimeout:10000,
  supportBigNumbers:true,bigNumberStrings:true,multipleStatements:false});
