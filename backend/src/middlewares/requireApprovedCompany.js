const {transaction}=require('../services/transactionService');
const {lockSessionUser}=require('../services/sessionPolicy');
const CustomModelError=require('../utils/customModelError');
/** REQUIRE A VERIFIED COMPANY BEFORE ACCESSING GENERAL COLLECTIONS
 * Mount after authenticate on any general publication-listing or collection route.
 * @param {import('express').Request} req @param {import('express').Response} _res
 * @param {import('express').NextFunction} next @returns {Promise<void>}
 */
exports.requireApprovedCompany=async(req,_res,next)=>{
 try{
  const auth=req.auth;
  if(!auth)throw new CustomModelError('User','Inicia sesión para continuar.','AUTH_REQUIRED',401);
  await transaction(async connection=>{
   const user=await lockSessionUser(auth,connection);
   if(user.userRoleCode!=='COMPANY'||user.userVerificationStatus!=='APPROVED')throw new CustomModelError('User','Solo las empresas aprobadas pueden explorar recolecciones.','COMPANY_PENDING',403);
  });
  next();
 }catch(error){next(error);}
};
