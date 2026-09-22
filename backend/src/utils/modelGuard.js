const {AuditService}=require('../services/auditService');
const {LogCategory}=require('./logCategories');
/** RUN MODEL OPERATION WITH SAFE AUDIT
 * @template T @param {string} model @param {string} operation @param {()=>Promise<T>} action @returns {Promise<T>}
 */
exports.modelGuard=async(model,operation,action)=>{
 try{return await action();}catch(error){await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Model operation failed',`${model}.js`,operation,null);throw error;}
};
