const {z}=require('zod');
const Notice=require('../models/Notice');
const {transaction}=require('./transactionService');
const {lockSessionUser}=require('./sessionPolicy');
const CustomModelError=require('../utils/customModelError');
const querySchema=z.object({status:z.enum(['ALL','READ','UNREAD']).default('ALL'),page:z.coerce.number().int().min(1).max(100000).default(1),limit:z.coerce.number().int().min(1).max(50).default(10)}).strict();
/** @param {import('./sessionPolicy').AuthContext} auth @param {import('mysql2/promise').PoolConnection} connection */
async function recipient(auth,connection){const user=await lockSessionUser(auth,connection,true);if(!['USER','COMPANY'].includes(user.userRoleCode))throw new CustomModelError('Notice','No tienes acceso a esta bandeja.','ROLE_FORBIDDEN',403);return user;}
/** @param {import('./sessionPolicy').AuthContext} auth @param {unknown} query */
exports.list=async(auth,query)=>{
 const parsed=querySchema.safeParse(query);if(!parsed.success)throw new CustomModelError('Notice','Filtros inválidos.','VALIDATION_ERROR',422);
 return transaction(async connection=>{const user=await recipient(auth,connection);return Notice.list(user.userId,parsed.data,connection);});
};
/** @param {import('./sessionPolicy').AuthContext} auth */
exports.count=auth=>transaction(async connection=>{const user=await recipient(auth,connection);return {unreadCount:await Notice.unreadCount(user.userId,connection),verificationStatus:user.userVerificationStatus};});
/** @param {import('./sessionPolicy').AuthContext} auth @param {string} uuid */
exports.markRead=async(auth,uuid)=>{
 if(!z.string().uuid().safeParse(uuid).success)throw new CustomModelError('Notice','Identificador inválido.','VALIDATION_ERROR',422);
 return transaction(async connection=>{const user=await recipient(auth,connection);const notice=await Notice.markRead(user.userId,uuid,connection);if(!notice)throw new CustomModelError('Notice','Aviso no encontrado.','NOTICE_NOT_FOUND',404);return notice;});
};
