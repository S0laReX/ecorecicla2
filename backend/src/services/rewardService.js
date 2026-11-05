const Reward=require('../models/Reward');
const Redemption=require('../models/RewardRedemption');
const {retryTransaction:transaction}=require('./transactionService');
const {lockSessionUser}=require('./sessionPolicy');
const {uuidSchema}=require('../schemas/publicationSchema');
const {rewardInputSchema,rewardUpdateSchema,redemptionInputSchema,pageQuerySchema,redemptionQuerySchema}=require('../schemas/rewardSchema');
const {z}=require('zod');
const CustomModelError=require('../utils/customModelError');
/** @param {import('./sessionPolicy').AuthContext} auth @param {'USER'|'ADMIN'} role @param {import('mysql2/promise').PoolConnection} connection */
async function requireRole(auth,role,connection){const user=await lockSessionUser(auth,connection);if(user.userRoleCode!==role)throw new CustomModelError('User',role==='USER'?'Solo los usuarios pueden canjear puntos por premios.':'Solo un administrador puede gestionar premios.','ROLE_FORBIDDEN',403);return user;}
/** @template {import('zod').ZodTypeAny} T @param {T} schema @param {unknown} input @returns {import('zod').output<T>} */
function parse(schema,input){const result=schema.safeParse(input);if(!result.success)throw new CustomModelError('Reward','Revisa los datos del premio o los filtros enviados.','VALIDATION_ERROR',422);return result.data;}
/** @param {import('./sessionPolicy').AuthContext} auth @param {unknown} input @param {boolean} [admin] */
exports.list=(auth,input,admin=false)=>transaction(async connection=>{
 const user=await requireRole(auth,admin?'ADMIN':'USER',connection);const query=parse(pageQuerySchema,input);
 const catalog=await Reward.list(admin,query,connection);return {...catalog,...(admin?{}:{wallet:await Redemption.wallet(user.userId,connection)})};
});
/** @param {import('./sessionPolicy').AuthContext} auth @param {unknown} input */
exports.create=(auth,input)=>transaction(async connection=>{await requireRole(auth,'ADMIN',connection);return Reward.create(parse(rewardInputSchema,input),connection);});
/** @param {import('./sessionPolicy').AuthContext} auth @param {string} uuid @param {unknown} input */
exports.update=(auth,uuid,input)=>transaction(async connection=>{await requireRole(auth,'ADMIN',connection);parse(uuidSchema,uuid);return Reward.update(uuid,parse(rewardUpdateSchema,input),connection);});
/** @param {import('./sessionPolicy').AuthContext} auth @param {string} uuid @param {unknown} input */
exports.redeem=(auth,uuid,input)=>transaction(async connection=>{
 const user=await requireRole(auth,'USER',connection);parse(uuidSchema,uuid);const data=parse(redemptionInputSchema,input);
 const previous=await Redemption.findRequest(user.userId,data.requestUUID,connection);
 if(previous){
  if(previous.rewardUUID!==uuid||previous.pointsCost!==data.expectedPointsCost)throw new CustomModelError('RewardRedemption','Esta solicitud ya corresponde a otro canje.','REDEMPTION_REQUEST_CONFLICT',409);
  return {redemption:previous,wallet:await Redemption.wallet(user.userId,connection)};
 }
 const reward=await Reward.find(uuid,connection,true);
 if(!reward||!reward.isActive)throw new CustomModelError('Reward','Este premio ya no está disponible.','REWARD_NOT_FOUND',404);
 if(reward.pointsCost!==data.expectedPointsCost)throw new CustomModelError('Reward','El costo del premio cambió. Actualiza el catálogo y revisa el nuevo costo.','REWARD_CHANGED',409);
 if(reward.stock<1)throw new CustomModelError('Reward','Este premio ya no tiene existencias.','REWARD_OUT_OF_STOCK',409);
 const wallet=await Redemption.wallet(user.userId,connection);
 if(wallet.availablePoints<reward.pointsCost)throw new CustomModelError('RewardRedemption','No tienes suficientes puntos para este premio.','INSUFFICIENT_POINTS',409);
 await Reward.takeStock(reward.rewardId,connection);
 const redemption=await Redemption.create({userId:user.userId,rewardId:reward.rewardId,rewardName:reward.name,pointsCost:reward.pointsCost,requestUUID:data.requestUUID},connection);
 return {redemption,wallet:{...wallet,spentPoints:wallet.spentPoints+reward.pointsCost,availablePoints:wallet.availablePoints-reward.pointsCost}};
});
/** @param {import('./sessionPolicy').AuthContext} auth @param {unknown} input @param {boolean} [admin] */
exports.history=(auth,input,admin=false)=>transaction(async connection=>{const user=await requireRole(auth,admin?'ADMIN':'USER',connection);return Redemption.list(admin?null:user.userId,parse(redemptionQuerySchema,input),connection);});
/** @param {import('./sessionPolicy').AuthContext} auth @param {string} uuid @param {unknown} input */
exports.deliver=(auth,uuid,input)=>transaction(async connection=>{
 const user=await requireRole(auth,'ADMIN',connection);parse(uuidSchema,uuid);parse(z.object({}).strict(),input);
 const result=await Redemption.deliver(uuid,user.userId,connection);if(!result)throw new CustomModelError('RewardRedemption','Canje no encontrado.','REDEMPTION_NOT_FOUND',404);return result;
});
