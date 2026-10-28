const {randomUUID,timingSafeEqual}=require('node:crypto');const {z}=require('zod');
const User=require('../models/User');const AuthSession=require('../models/AuthSession');
const {loginSchema}=require('../schemas/authSchema');const CustomModelError=require('../utils/customModelError');
const {verifyPassword}=require('./passwordService');const {publicUser}=require('./accountService');
const {transaction}=require('./transactionService');const {assertActive,lockSessionUser}=require('./sessionPolicy');const tokens=require('./tokenService');
/** AUTHENTICATE ACCOUNT @param {unknown} body */
async function login(body){
 const parsed=loginSchema.safeParse(body);if(!parsed.success)throw new CustomModelError('User','Correo o contraseña incorrectos.','INVALID_CREDENTIALS',401);
 const user=await User.findByEmail(parsed.data.email);
 const dummy=`scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`;
 const correct=await verifyPassword(parsed.data.password,user?.userPasswordHash||dummy);
 if(!user||!correct)throw new CustomModelError('User','Correo o contraseña incorrectos.','INVALID_CREDENTIALS',401);
 return transaction(async connection=>{
  const current=await User.findContextForUpdate(user.userUUID,connection);assertActive(current,true);
  if(current.userPasswordHash!==user.userPasswordHash)throw new CustomModelError('User','Vuelve a iniciar sesión.','INVALID_CREDENTIALS',401);
  const sessionUUID=randomUUID();const refreshToken=tokens.refreshToken(sessionUUID);
  const accessToken=tokens.accessToken(current,sessionUUID);
  await AuthSession.create({sessionUUID,userId:current.userId,refreshHash:tokens.hashToken(refreshToken),expiresAt:new Date(Date.now()+7*86400000)},connection);
  return {user:publicUser(current),tokens:{accessToken,refreshToken,expiresIn:1800}};
 });
}
/** ROTATE REFRESH TOKEN @param {unknown} body */
async function refresh(body){
 const parsed=z.object({refreshToken:z.string().regex(/^[a-f0-9-]{36}\.[a-f0-9]{64}$/),userUUID:z.string().uuid()}).strict().safeParse(body);
 if(!parsed.success)throw new CustomModelError('AuthSession','Sesión inválida.','SESSION_INVALID',401);
 const input=parsed.data;const sessionUUID=input.refreshToken.split('.')[0];
 const result=await transaction(async connection=>{
  const user=await User.findContextForUpdate(input.userUUID,connection);assertActive(user,true);
  const session=await AuthSession.findByUUID(sessionUUID,connection,true);
  if(!session||session.sessionUserId!==user.userId||session.sessionRevokedAt||session.sessionExpiresAt.getTime()<=Date.now())throw new CustomModelError('AuthSession','La sesión expiró.','SESSION_INVALID',401);
  if(!timingSafeEqual(Buffer.from(session.sessionRefreshHash,'hex'),Buffer.from(tokens.hashToken(input.refreshToken),'hex'))){await AuthSession.revoke(sessionUUID,user.userId,connection);return null;}
  const refreshToken=tokens.refreshToken(sessionUUID);const accessToken=tokens.accessToken(user,sessionUUID);
  await AuthSession.updateRefresh(sessionUUID,{refreshHash:tokens.hashToken(refreshToken)},connection);
  return {user:publicUser(user),tokens:{accessToken,refreshToken,expiresIn:1800}};
 });
 if(!result)throw new CustomModelError('AuthSession','La sesión fue invalidada. Inicia sesión nuevamente.','SESSION_INVALID',401);return result;
}
/** RETRIEVE CURRENT ACCOUNT @param {import('./sessionPolicy').AuthContext} auth */
async function currentUser(auth){return transaction(async connection=>publicUser(await lockSessionUser(auth,connection,true)));}
/** CLOSE CURRENT SESSION @param {import('./sessionPolicy').AuthContext} auth */
async function logout(auth){return transaction(async connection=>{const user=await lockSessionUser(auth,connection,true);await AuthSession.revoke(auth.sessionUUID,user.userId,connection);return {};});}
module.exports={login,refresh,currentUser,logout};
