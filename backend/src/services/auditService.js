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
  }
};
