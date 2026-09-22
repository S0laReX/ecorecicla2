const {uuidSchema} = require('../schemas/publicationSchema');
const CustomModelError = require('../utils/customModelError');
const {AuditService} = require('../services/auditService');
const {LogCategory} = require('../utils/logCategories');
/** @typedef {{userId:string,userUUID:string,userRoleCode:string,userAccountStatus:string,userVerificationStatus:string,userTokenVersion:number}} UserContext */
// FIND
/** FIND AND LOCK CURRENT USER CONTEXT
 * @param {string} userUUID @param {import('mysql2/promise').PoolConnection} connection
 * @returns {Promise<UserContext|null>}
 */
exports.findContextForUpdate = async (userUUID, connection) => {
  try {
    if (!uuidSchema.safeParse(userUUID).success) throw new CustomModelError('User','Identidad inválida.');
    const userQuery = `SELECT CAST(U.id AS CHAR) AS userId, U.internalUUID AS userUUID,
      U.roleCode AS userRoleCode, U.accountStatus AS userAccountStatus,
      U.verificationStatus AS userVerificationStatus, U.tokenVersion AS userTokenVersion
      FROM User U WHERE U.internalUUID = ? AND U.deletedAt IS NULL LIMIT 1 FOR UPDATE`;
    const userParams = [userUUID];
    const [users] = await connection.execute(userQuery,userParams);
    return /** @type {Array<import('mysql2').RowDataPacket & UserContext>} */ (users)[0] || null;
  } catch (error) {
    await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','User lookup failed','User.js','findContextForUpdate',null);
    throw error;
  }
};
