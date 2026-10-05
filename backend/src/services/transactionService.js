const {pool}=require('../config/database');const {AuditService}=require('./auditService');const {LogCategory}=require('../utils/logCategories');
/** RUN TRANSACTION @template T @param {(connection:import('mysql2/promise').PoolConnection)=>Promise<T>} action @returns {Promise<T>} */
exports.transaction=async(action)=>{
 const connection=await pool.getConnection();try{await connection.beginTransaction();const result=await action(connection);await connection.commit();return result;}
 catch(error){try{await connection.rollback();}catch{await AuditService.logSystem(LogCategory.STABILITY,'ERROR','Rollback failed','transactionService.js','transaction',null);}throw error;}
 finally{connection.release();}
};
