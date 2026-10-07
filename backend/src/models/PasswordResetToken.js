const {z}=require('zod');const {pool}=require('../config/database');const {ownerIdSchema}=require('../schemas/publicationSchema');
const {modelGuard}=require('../utils/modelGuard');const CustomModelError=require('../utils/customModelError');
const hashSchema=z.string().regex(/^[a-f0-9]{64}$/);
/** @typedef {import('mysql2/promise').PoolConnection} Connection */
/** @typedef {{resetUserId:string,resetExpiresAt:Date,resetUsedAt:Date|null}} ResetToken */
// FIND
/** FIND PASSWORD RESET TOKEN @param {string} tokenHash @param {Connection|null} [connection] @param {boolean} [lock] @returns {Promise<ResetToken|null>} */
exports.findByHash=(tokenHash,connection=null,lock=false)=>modelGuard('PasswordResetToken','findByHash',async()=>{
 if(!hashSchema.safeParse(tokenHash).success)throw new CustomModelError('PasswordResetToken','Enlace inválido.');
 const passwordResetTokenQuery=`SELECT CAST(T.userId AS CHAR) AS resetUserId, T.expiresAt AS resetExpiresAt, T.usedAt AS resetUsedAt
 FROM PasswordResetToken T WHERE T.tokenHash = ? LIMIT 1${lock?' FOR UPDATE':''}`;
 const passwordResetTokenParams=[tokenHash];const [tokens]=await(connection||pool).execute(passwordResetTokenQuery,passwordResetTokenParams);
 return /** @type {Array<import('mysql2').RowDataPacket & ResetToken>} */(tokens)[0]||null;
});
// CREATE
/** CREATE PASSWORD RESET TOKEN @param {{userId:string,tokenHash:string,expiresAt:Date}} data @param {Connection} connection @returns {Promise<void>} */
exports.create=(data,connection)=>modelGuard('PasswordResetToken','create',async()=>{
 if(!z.object({userId:ownerIdSchema,tokenHash:hashSchema,expiresAt:z.date()}).strict().safeParse(data).success)throw new CustomModelError('PasswordResetToken','Enlace inválido.');
 const passwordResetTokenQuery='INSERT INTO PasswordResetToken (userId,tokenHash,expiresAt) VALUES (?,?,?)';
 const passwordResetTokenParams=[data.userId,data.tokenHash,data.expiresAt];await connection.execute(passwordResetTokenQuery,passwordResetTokenParams);
});
// DELETE LOGICAL — consume every outstanding token for this account atomically.
/** INVALIDATE USER RESET TOKENS @param {string} userId @param {Connection} connection @returns {Promise<void>} */
exports.consumeByUser=(userId,connection)=>modelGuard('PasswordResetToken','consumeByUser',async()=>{
 if(!ownerIdSchema.safeParse(userId).success)throw new CustomModelError('PasswordResetToken','Identidad inválida.');
 const passwordResetTokenQuery='UPDATE PasswordResetToken SET usedAt = UTC_TIMESTAMP(3) WHERE userId = ? AND usedAt IS NULL';
 const passwordResetTokenParams=[userId];await connection.execute(passwordResetTokenQuery,passwordResetTokenParams);
});
