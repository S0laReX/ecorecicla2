const {registerAccount}=require('../services/accountService');
const {apiError}=require('../utils/apiError');
const {AuditService}=require('../services/auditService');
const {LogCategory}=require('../utils/logCategories');
/** REGISTER ACCOUNT
 * @param {import('express').Request<Record<string,string>,unknown,unknown>} req
 * @param {import('express').Response} res @returns {Promise<void>}
 */
exports.registerUser=async(req,res)=>{
 try{const user=await registerAccount(req.body,req.file);res.status(201).json({success:true,message:user.roleCode==='COMPANY'?'Empresa registrada. La verificación está pendiente.':'Cuenta creada. Ya puedes iniciar sesión.',data:user});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.AUTH,'ERROR','Registration failed','authController.js','registerUser',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
