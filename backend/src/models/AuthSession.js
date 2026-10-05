const {z}=require('zod');const {pool}=require('../config/database');
const {uuidSchema,ownerIdSchema}=require('../schemas/publicationSchema');
const {modelGuard}=require('../utils/modelGuard');const CustomModelError=require('../utils/customModelError');
const hashSchema=z.string().regex(/^[a-f0-9]{64}$/);
/** @typedef {import('mysql2/promise').PoolConnection} Connection */
/** @typedef {{sessionUUID:string,sessionUserId:string,sessionRefreshHash:string,sessionExpiresAt:Date,sessionRevokedAt:Date|null}} Session */
// FIND
/** FIND SESSION @param {string} sessionUUID @param {Connection|null} [connection] @param {boolean} [lock] @returns {Promise<Session|null>} */
exports.findByUUID=(sessionUUID,connection=null,lock=false)=>modelGuard('AuthSession','findByUUID',async()=>{
 if(!uuidSchema.safeParse(sessionUUID).success)throw new CustomModelError('AuthSession','Sesión inválida.','SESSION_INVALID',401);
 const authSessionQuery=`SELECT S.internalUUID AS sessionUUID, CAST(S.userId AS CHAR) AS sessionUserId, S.refreshHash AS sessionRefreshHash,
 S.expiresAt AS sessionExpiresAt, S.revokedAt AS sessionRevokedAt FROM AuthSession S WHERE S.internalUUID = ? LIMIT 1${lock?' FOR UPDATE':''}`;
 const authSessionParams=[sessionUUID];const [sessions]=await(connection||pool).execute(authSessionQuery,authSessionParams);
 return /** @type {Array<import('mysql2').RowDataPacket & Session>} */(sessions)[0]||null;
});
// CREATE
/** CREATE SESSION @param {{sessionUUID:string,userId:string,refreshHash:string,expiresAt:Date}} data @param {Connection} connection @returns {Promise<void>} */
exports.create=(data,connection)=>modelGuard('AuthSession','create',async()=>{
 const parsed=z.object({sessionUUID:uuidSchema,userId:ownerIdSchema,refreshHash:hashSchema,expiresAt:z.date()}).strict().safeParse(data);
 if(!parsed.success)throw new CustomModelError('AuthSession','Sesión inválida.');
 const authSessionQuery='INSERT INTO AuthSession (internalUUID,userId,refreshHash,expiresAt) VALUES (?,?,?,?)';
 const authSessionParams=[data.sessionUUID,data.userId,data.refreshHash,data.expiresAt];await connection.execute(authSessionQuery,authSessionParams);
});
// UPDATE — independent whitelist: refreshHash only. Absolute expiry never slides.
/** ROTATE REFRESH HASH @param {string} sessionUUID @param {{refreshHash:string}} data @param {Connection} connection @returns {Promise<void>} */
exports.updateRefresh=(sessionUUID,data,connection)=>modelGuard('AuthSession','updateRefresh',async()=>{
 if(!uuidSchema.safeParse(sessionUUID).success||!z.object({refreshHash:hashSchema}).strict().safeParse(data).success)throw new CustomModelError('AuthSession','Sesión inválida.');
 const authSessionQuery='UPDATE AuthSession SET refreshHash = ? WHERE internalUUID = ? AND revokedAt IS NULL AND expiresAt > UTC_TIMESTAMP(3)';
 const authSessionParams=[data.refreshHash,sessionUUID];await connection.execute(authSessionQuery,authSessionParams);
});
// DELETE LOGICAL
/** REVOKE ONE SESSION @param {string} sessionUUID @param {string} userId @param {Connection} connection @returns {Promise<void>} */
exports.revoke=(sessionUUID,userId,connection)=>modelGuard('AuthSession','revoke',async()=>{
 if(!uuidSchema.safeParse(sessionUUID).success||!ownerIdSchema.safeParse(userId).success)throw new CustomModelError('AuthSession','Sesión inválida.');
 const authSessionQuery='UPDATE AuthSession SET revokedAt = UTC_TIMESTAMP(3) WHERE internalUUID = ? AND userId = ? AND revokedAt IS NULL';
 const authSessionParams=[sessionUUID,userId];await connection.execute(authSessionQuery,authSessionParams);
});
/** REVOKE ALL USER SESSIONS @param {string} userId @param {Connection} connection @returns {Promise<void>} */
exports.revokeByUser=(userId,connection)=>modelGuard('AuthSession','revokeByUser',async()=>{
 if(!ownerIdSchema.safeParse(userId).success)throw new CustomModelError('AuthSession','Identidad inválida.');
 const authSessionQuery='UPDATE AuthSession SET revokedAt = UTC_TIMESTAMP(3) WHERE userId = ? AND revokedAt IS NULL';
 const authSessionParams=[userId];await connection.execute(authSessionQuery,authSessionParams);
});
