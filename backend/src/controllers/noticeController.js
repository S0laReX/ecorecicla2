const service=require('../services/noticeService');
const {apiError}=require('../utils/apiError');
const {AuditService}=require('../services/auditService');
const {LogCategory}=require('../utils/logCategories');
/** @param {unknown} error @param {import('express').Request} req @param {import('express').Response} res */
async function fail(error,req,res){const failure=apiError(error);await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Notice request failed','noticeController.js','request',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
const CustomModelError=require('../utils/customModelError');
/** @param {import('express').Request} req */
function auth(req){if(!req.auth)throw new CustomModelError('User','Inicia sesión.','AUTH_REQUIRED',401);return req.auth;}
/** @param {import('express').Request} req @param {import('express').Response} res */
exports.list=async(req,res)=>{try{const result=await service.list(auth(req),req.query);res.json({success:true,message:'Avisos recuperados.',data:result.items,meta:result.meta});}catch(error){await fail(error,req,res);}};
/** @param {import('express').Request} req @param {import('express').Response} res */
exports.count=async(req,res)=>{try{res.json({success:true,message:'Contador recuperado.',data:await service.count(auth(req))});}catch(error){await fail(error,req,res);}};
/** @param {import('express').Request<{uuid:string}>} req @param {import('express').Response} res */
exports.markRead=async(req,res)=>{try{res.json({success:true,message:'Aviso leído.',data:await service.markRead(auth(req),req.params.uuid)});}catch(error){await fail(error,req,res);}};
