const {registerAccount}=require('../services/accountService');
const {apiError}=require('../utils/apiError');
const {AuditService}=require('../services/auditService');
const {LogCategory}=require('../utils/logCategories');
const authService=require('../services/authService');
const recoveryService=require('../services/recoveryService');
const CustomModelError=require('../utils/customModelError');
/** REQUIRE VERIFIED AUTH CONTEXT @param {import('express').Request} req @returns {import('../services/sessionPolicy').AuthContext} */
function requireAuth(req){if(!req.auth)throw new CustomModelError('User','Inicia sesión.','AUTH_REQUIRED',401);return req.auth;}
/** RETRIEVE ROLE DASHBOARD
 * @param {import('express').Request<{role:string},unknown,unknown>} req
 * @param {import('express').Response} res @returns {Promise<void>}
 */
exports.retrieveRoleDashboard=async(req,res)=>{
 try{const user=await authService.currentUser(requireAuth(req));if(user.roleCode!==req.params.role)throw new CustomModelError('User','No tienes acceso a este panel.','ROLE_FORBIDDEN',403);
 if(user.roleCode==='COMPANY'&&user.verificationStatus!=='APPROVED')throw new CustomModelError('User','Tu empresa está pendiente de aprobación.','COMPANY_PENDING',403);
 res.status(200).json({success:true,message:'Acceso al panel autorizado.',data:{user}});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.AUTH,'ERROR','Dashboard access failed','authController.js','retrieveRoleDashboard',req.ip||null,{errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/** REGISTER ACCOUNT
 * @param {import('express').Request<Record<string,string>,unknown,unknown>} req
 * @param {import('express').Response} res @returns {Promise<void>}
 */
exports.registerUser=async(req,res)=>{
 try{const user=await registerAccount(req.body,req.file);res.status(201).json({success:true,message:user.roleCode==='COMPANY'?'Empresa registrada. La verificación está pendiente.':'Cuenta creada. Ya puedes iniciar sesión.',data:user});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.AUTH,'ERROR','Registration failed','authController.js','registerUser',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/** RESET USER PASSWORD
 * @param {import('express').Request<Record<string,string>,unknown,unknown>} req
 * @param {import('express').Response} res @returns {Promise<void>}
 */
exports.resetUserPassword=async(req,res)=>{
 try{await recoveryService.resetPassword(req.body);res.status(200).json({success:true,message:'Contraseña actualizada. Inicia sesión nuevamente.',data:{}});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.AUTH,'ERROR','Authentication operation failed','authController.js','resetUserPassword',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/** REQUEST PASSWORD RECOVERY
 * @param {import('express').Request<Record<string,string>,unknown,unknown>} req
 * @param {import('express').Response} res @returns {Promise<void>}
 */
exports.requestPasswordRecovery=async(req,res)=>{
 try{await recoveryService.requestRecovery(req.body);res.status(200).json({success:true,message:'Si la cuenta existe, recibirás instrucciones para recuperar tu acceso.',data:{}});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.AUTH,'ERROR','Authentication operation failed','authController.js','requestPasswordRecovery',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/** LOGOUT USER
 * @param {import('express').Request<Record<string,string>,unknown,unknown>} req
 * @param {import('express').Response} res @returns {Promise<void>}
 */
exports.logoutUser=async(req,res)=>{
 try{const data=await authService.logout(requireAuth(req));res.status(200).json({success:true,message:'Sesión cerrada.',data:data||{}});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.AUTH,'ERROR','Authentication operation failed','authController.js','logoutUser',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/** RETRIEVE CURRENT USER
 * @param {import('express').Request<Record<string,string>,unknown,unknown>} req
 * @param {import('express').Response} res @returns {Promise<void>}
 */
exports.retrieveCurrentUser=async(req,res)=>{
 try{const data=await authService.currentUser(requireAuth(req));res.status(200).json({success:true,message:'Cuenta recuperada.',data:data||{}});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.AUTH,'ERROR','Authentication operation failed','authController.js','retrieveCurrentUser',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/** REFRESH USER SESSION
 * @param {import('express').Request<Record<string,string>,unknown,unknown>} req
 * @param {import('express').Response} res @returns {Promise<void>}
 */
exports.refreshUserSession=async(req,res)=>{
 try{const data=await authService.refresh(req.body);res.status(200).json({success:true,message:'Sesión renovada.',data:data||{}});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.AUTH,'ERROR','Authentication operation failed','authController.js','refreshUserSession',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/** AUTHENTICATE USER
 * @param {import('express').Request<Record<string,string>,unknown,unknown>} req
 * @param {import('express').Response} res @returns {Promise<void>}
 */
exports.authenticateUser=async(req,res)=>{
 try{const data=await authService.login(req.body);res.status(200).json({success:true,message:'Sesión iniciada.',data:data||{}});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.AUTH,'ERROR','Authentication operation failed','authController.js','authenticateUser',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
