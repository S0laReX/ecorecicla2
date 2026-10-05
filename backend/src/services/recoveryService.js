const {z}=require('zod');const {randomBytes}=require('node:crypto');
const User=require('../models/User');const PasswordResetToken=require('../models/PasswordResetToken');const AuthSession=require('../models/AuthSession');
const {emailSchema,passwordSchema}=require('../schemas/authSchema');const {hashToken}=require('./tokenService');const {hashPassword}=require('./passwordService');
const {transaction}=require('./transactionService');const {deliverRecovery}=require('./recoveryDelivery');const CustomModelError=require('../utils/customModelError');
const {AuditService}=require('./auditService');const {LogCategory}=require('../utils/logCategories');
/** REQUEST PASSWORD RECOVERY @param {unknown} body @returns {Promise<void>} */
async function requestRecovery(body){
 const parsed=z.object({email:emailSchema}).strict().safeParse(body);if(!parsed.success)throw new CustomModelError('User','Escribe un correo válido.');
 const user=await User.findByEmail(parsed.data.email);if(!user)return;
 const token=randomBytes(32).toString('hex');
 const origin=process.env.FRONTEND_ORIGIN||'http://localhost:3000';const link=`${origin}/restablecer#token=${token}&user=${user.userUUID}`;
 await transaction(async connection=>{
  const current=await User.findContextForUpdate(user.userUUID,connection);if(!current)return;
  await PasswordResetToken.consumeByUser(user.userId,connection);
  await PasswordResetToken.create({userId:user.userId,tokenHash:hashToken(token),expiresAt:new Date(Date.now()+20*60000)},connection);
 });
 // Token never appears in API response or audit log. Mail is transactional recovery, not notifications.
 try{await deliverRecovery(user.userEmail,link);}catch{await AuditService.logSystem(LogCategory.EMAIL,'ERROR','Recovery delivery failed','recoveryService.js','requestRecovery',null);}
}
/** REPLACE PASSWORD WITH SINGLE USE TOKEN @param {unknown} body @returns {Promise<void>} */
async function resetPassword(body){
 const parsed=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),userUUID:z.string().uuid(),password:passwordSchema}).strict().safeParse(body);
 if(!parsed.success)throw new CustomModelError('User','Revisa el enlace y la nueva contraseña.');
 const data=parsed.data;const passwordHash=await hashPassword(data.password);
 await transaction(async connection=>{
  const user=await User.findContextForUpdate(data.userUUID,connection);const reset=await PasswordResetToken.findByHash(hashToken(data.token),connection,true);
  if(!user||!reset||reset.resetUserId!==user.userId||reset.resetUsedAt||reset.resetExpiresAt.getTime()<=Date.now())throw new CustomModelError('User','El enlace es inválido, ya fue usado o expiró.','RESET_INVALID',422);
  await User.updatePassword(user.userId,{passwordHash},connection);await PasswordResetToken.consumeByUser(user.userId,connection);await AuthSession.revokeByUser(user.userId,connection);
 });
}
module.exports={requestRecovery,resetPassword};
