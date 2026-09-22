const {pool} = require('../config/database');
const CustomModelError = require('../utils/customModelError');
const {AuditService} = require('../services/auditService');
const {LogCategory} = require('../utils/logCategories');
/** FIND ROLE BY CODE
 * @param {string} code @param {import('mysql2/promise').PoolConnection|null} [connection]
 * @returns {Promise<{roleUUID:string,roleCode:string}|null>}
 */
exports.findByCode = async (code,connection=null) => {
 try {
  if (!['USER','COMPANY','ADMIN'].includes(code)) throw new CustomModelError('Role','Rol inválido.');
  const roleQuery = 'SELECT R.internalUUID AS roleUUID, R.code AS roleCode FROM Role R WHERE R.code = ? LIMIT 1';
  const roleParams = [code];
  const [roles] = await (connection || pool).execute(roleQuery,roleParams);
  return /** @type {Array<import('mysql2').RowDataPacket & {roleUUID:string,roleCode:string}>} */ (roles)[0] || null;
 } catch (error) {
  await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Role lookup failed','Role.js','findByCode',null);
  throw error;
 }
};
