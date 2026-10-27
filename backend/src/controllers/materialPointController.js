const service=require('../services/materialPointService');
const CustomModelError=require('../utils/customModelError');
const {apiError}=require('../utils/apiError');
const {AuditService}=require('../services/auditService');
const {LogCategory}=require('../utils/logCategories');
/** @param {import('express').Request} req */
function auth(req){if(!req.auth)throw new CustomModelError('User','Inicia sesión.','AUTH_REQUIRED',401);return req.auth;}
/** @param {unknown} error @param {import('express').Request} req @param {import('express').Response} res */
async function fail(error,req,res){
 const result=apiError(error);
 await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Material point configuration failed','materialPointController.js','request',req.ip||null,{requestId:req.requestId,errorCode:result.errorCode});
 res.status(result.statusCode).json(result);
}
/** @param {import('express').Request} req @param {import('express').Response} res */
exports.list=async(req,res)=>{try{res.json({success:true,message:'Puntos por material recuperados.',data:await service.list(auth(req))});}catch(error){await fail(error,req,res);}};
/** @param {import('express').Request<{materialType:string}>} req @param {import('express').Response} res */
exports.save=async(req,res)=>{try{res.json({success:true,message:'Puntos guardados. Se aplicarán a las próximas confirmaciones.',data:await service.save(auth(req),req.params.materialType,req.body)});}catch(error){await fail(error,req,res);}};
