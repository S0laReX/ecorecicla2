const Setting=require('../models/MaterialPointSetting');
const {retryTransaction:transaction}=require('./transactionService');
const {lockSessionUser}=require('./sessionPolicy');
const {materialTypeSchema,materialPointInputSchema}=require('../schemas/materialPointSchema');
const CustomModelError=require('../utils/customModelError');
/** @param {import('./sessionPolicy').AuthContext} auth @param {import('mysql2/promise').PoolConnection} connection */
async function requireAdmin(auth,connection){
 const user=await lockSessionUser(auth,connection);
 if(user.userRoleCode!=='ADMIN')throw new CustomModelError('User','Solo un administrador puede configurar puntos.','ROLE_FORBIDDEN',403);
}
/** @param {import('./sessionPolicy').AuthContext} auth */
exports.list=auth=>transaction(async connection=>{await requireAdmin(auth,connection);return Setting.findAll(connection);});
/** @param {import('./sessionPolicy').AuthContext} auth @param {string} materialType @param {unknown} input */
exports.save=(auth,materialType,input)=>transaction(async connection=>{
 await requireAdmin(auth,connection);
 const material=materialTypeSchema.safeParse(materialType);const values=materialPointInputSchema.safeParse(input);
 if(!material.success||!values.success)throw new CustomModelError('MaterialPointSetting','Elige un material válido y puntos enteros entre 0 y 1000000.','VALIDATION_ERROR',422);
 return Setting.save(material.data,values.data,connection);
});
