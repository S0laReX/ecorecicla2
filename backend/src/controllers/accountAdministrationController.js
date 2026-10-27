const {z}=require('zod');
const CustomModelError=require('../utils/customModelError');
const {apiError}=require('../utils/apiError');
const {AuditService}=require('../services/auditService');
const {LogCategory}=require('../utils/logCategories');
const service=require('../services/accountAdministrationService');
const source='accountAdministrationController.js';
const querySchema=z.object({page:z.coerce.number().int().min(1).max(100000).default(1),limit:z.coerce.number().int().min(1).max(50).default(10),search:z.string().trim().max(120).default(''),status:z.enum(['ALL','ACTIVE','PENDING','APPROVED','REJECTED','SUSPENDED']).default('ALL')}).strict();
const statusSchema=z.object({status:z.enum(['ACTIVE','SUSPENDED'])}).strict();
/** @param {import('express').Request} req */
function requireAuth(req){if(!req.auth)throw new CustomModelError('User','Inicia sesión.','AUTH_REQUIRED',401);return req.auth;}

/** LIST USERS AND COMPANIES WITH THEIR CURRENT ADMINISTRATIVE STATUS */
/** @param {import('express').Request} req @param {import('express').Response} res */
exports.listAccounts=async(req,res)=>{
 try{
  const query=querySchema.safeParse(req.query);if(!query.success)throw new CustomModelError('User','Parámetros de búsqueda inválidos.','VALIDATION_ERROR',422);
  const result=await service.listAccounts(requireAuth(req),query.data);
  res.status(200).json({success:true,message:'Cuentas recuperadas.',data:result.accounts,meta:result.meta});
 }catch(error){
  const failure=apiError(error);await AuditService.logSystem(LogCategory.SECURITY,'ERROR','Account list failed',source,'listAccounts',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});
  res.status(failure.statusCode).json(failure);
 }
};

/** SUSPEND OR REACTIVATE A USER OR COMPANY */
/** @param {import('express').Request<{userUUID:string}>} req @param {import('express').Response} res */
exports.changeAccountStatus=async(req,res)=>{
 try{
  const parsed=statusSchema.safeParse(req.body);if(!parsed.success)throw new CustomModelError('User','Elige activar o suspender la cuenta.','VALIDATION_ERROR',422);
  const result=await service.changeAccountStatus(requireAuth(req),req.params.userUUID,parsed.data.status);
  res.status(200).json({success:true,message:parsed.data.status==='SUSPENDED'?'Cuenta suspendida.':'Cuenta reactivada.',data:result});
 }catch(error){
  const failure=apiError(error);await AuditService.logSystem(LogCategory.SECURITY,'ERROR','Account status change failed',source,'changeAccountStatus',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});
  res.status(failure.statusCode).json(failure);
 }
};
