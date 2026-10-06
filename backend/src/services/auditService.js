const {LogCategory}=require('../utils/logCategories');
exports.AuditService = {
  /** WRITE STRUCTURED AUDIT EVENT
   * @param {string} category @param {string} level @param {string} message
   * @param {string} source @param {string} functionName @param {string|null} ip
   * @param {Record<string, unknown>} [metadata] @returns {Promise<void>}
   */
  async logSystem(category, level, message, source, functionName, ip, metadata = {}) {
    // Callers pass allowlisted metadata only; never body, token, SQL, photo or raw exception.
    try { process.stderr.write(JSON.stringify({timestamp:new Date().toISOString(),category,level,message,source,functionName,ip,metadata})+'\n'); }
    catch { /* Logging failures must not replace the original outcome. */ }
  },
  /** AUDIT ADMINISTRATIVE ACTIVITY @param {string} actorUUID @param {string} action @param {Record<string,unknown>} metadata */
  async logUserActivity(actorUUID,action,metadata={}) {
    try { process.stderr.write(JSON.stringify({timestamp:new Date().toISOString(),category:LogCategory.EVENT,level:'INFO',message:'Administrative activity recorded',source:'auditService.js',functionName:'logUserActivity',actorUUID,action,metadata})+'\n'); }
    catch { /* Persistent business decisions are committed separately in their transaction. */ }
  },
  /** AUDIT ACCESS TO SENSITIVE COMPANY DATA @param {string} actorUUID @param {string} resource @param {string|null} ip @param {Record<string,unknown>} metadata */
  async logSensitiveDataAccess(actorUUID,resource,ip,metadata={}) {
    try { process.stderr.write(JSON.stringify({timestamp:new Date().toISOString(),category:LogCategory.SECURITY,level:'INFO',message:'Sensitive company data accessed',source:'auditService.js',functionName:'logSensitiveDataAccess',actorUUID,resource,ip,metadata})+'\n'); }
    catch { /* Read access remains available if the diagnostic sink is unavailable. */ }
  }
};
