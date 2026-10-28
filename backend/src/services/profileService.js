const Profile=require('../models/AccountProfile');
const {lockSessionUser}=require('./sessionPolicy');
const {retryTransaction:transaction}=require('./transactionService');
const {profileInputSchema,historyQuerySchema}=require('../schemas/profileSchema');
const CustomModelError=require('../utils/customModelError');
/** @param {import('./sessionPolicy').AuthContext} auth @param {import('mysql2/promise').PoolConnection} connection */
async function member(auth,connection){const user=await lockSessionUser(auth,connection);if(!['USER','COMPANY'].includes(user.userRoleCode))throw new CustomModelError('User','Solo usuarios y empresas pueden consultar su perfil.','ROLE_FORBIDDEN',403);return user;}
/** @param {import('./sessionPolicy').AuthContext} auth */
exports.read=auth=>transaction(async connection=>{const user=await member(auth,connection);return {profile:await Profile.read(user.userId,connection),summary:await Profile.summary(user.userId,connection)};});
/** @param {import('./sessionPolicy').AuthContext} auth @param {unknown} input */
exports.update=(auth,input)=>transaction(async connection=>{
 const user=await member(auth,connection);const parsed=profileInputSchema.safeParse(input);if(!parsed.success)throw new CustomModelError('AccountProfile','Revisa el nombre, contacto y dirección o zona.','VALIDATION_ERROR',422);
 await Profile.update(user.userId,parsed.data,connection);return Profile.read(user.userId,connection);
});
/** @param {import('./sessionPolicy').AuthContext} auth @param {unknown} input */
exports.history=(auth,input)=>transaction(async connection=>{
 const user=await member(auth,connection);const query=historyQuerySchema.safeParse(input);if(!query.success)throw new CustomModelError('AccountProfile','Revisa el estado y la paginación.','VALIDATION_ERROR',422);
 return Profile.history(user.userId,query.data,connection);
});
