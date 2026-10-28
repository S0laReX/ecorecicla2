const service=require('../services/profileService');
const CustomModelError=require('../utils/customModelError');
const {apiError}=require('../utils/apiError');
const {AuditService}=require('../services/auditService');
const {LogCategory}=require('../utils/logCategories');
/** @param {import('express').Request} req */
function auth(req){if(!req.auth)throw new CustomModelError('User','Inicia sesión.','AUTH_REQUIRED',401);return req.auth;}
/** @param {unknown} error @param {import('express').Request} req @param {import('express').Response} res */
async function fail(error,req,res){const result=apiError(error);await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Profile request failed','profileController.js','request',req.ip||null,{requestId:req.requestId,errorCode:result.errorCode});res.status(result.statusCode).json(result);}
/** @param {import('express').Request} req @param {import('express').Response} res */
exports.read=async(req,res)=>{try{res.json({success:true,message:'Perfil recuperado.',data:await service.read(auth(req))});}catch(error){await fail(error,req,res);}};
/** @param {import('express').Request} req @param {import('express').Response} res */
exports.update=async(req,res)=>{try{res.json({success:true,message:'Perfil actualizado.',data:await service.update(auth(req),req.body)});}catch(error){await fail(error,req,res);}};
/** @param {import('express').Request} req @param {import('express').Response} res */
exports.history=async(req,res)=>{try{const result=await service.history(auth(req),req.query);res.json({success:true,message:'Historial recuperado.',data:result.items,meta:result.meta});}catch(error){await fail(error,req,res);}};
