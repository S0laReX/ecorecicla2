const {z}=require('zod');
const CustomModelError=require('../utils/customModelError');
const {apiError}=require('../utils/apiError');
const {AuditService}=require('../services/auditService');
const {LogCategory}=require('../utils/logCategories');
const service=require('../services/companyAdministrationService');
const source='companyAdministrationController.js';
const decisionSchema=z.discriminatedUnion('decision',[
 z.object({decision:z.literal('APPROVED')}).strict(),
 z.object({decision:z.literal('REJECTED'),reason:z.string().trim().min(3).max(300).refine(value=>!/[\x00-\x1f\x7f]/.test(value))}).strict()
]);
/** REQUIRE AUTHENTICATED CONTEXT @param {import('express').Request} req @returns {import('../services/sessionPolicy').AuthContext} */
function requireAuth(req){if(!req.auth)throw new CustomModelError('User','Inicia sesión.','AUTH_REQUIRED',401);return req.auth;}
/** LIST PENDING COMPANY APPLICATIONS
 * @param {import('express').Request} req @param {import('express').Response} res @returns {Promise<void>}
 */
exports.listPendingCompanyApplications=async(req,res)=>{
 const functionName='listPendingCompanyApplications';
 try{
  const query=z.object({page:z.coerce.number().int().min(1).max(100000).default(1),limit:z.coerce.number().int().min(1).max(50).default(10),search:z.string().trim().max(120).default('')}).strict().safeParse(req.query);
  if(!query.success)throw new CustomModelError('CompanyProfile','Parámetros de búsqueda inválidos.');
  const result=await service.listPendingCompanyApplications(requireAuth(req),query.data.page,query.data.limit,query.data.search);
  res.status(200).json({success:true,message:'Solicitudes pendientes recuperadas.',data:result.companies,meta:result.meta});
 }catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.SECURITY,'ERROR','Company application list failed',source,functionName,req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/** RETRIEVE PRIVATE PENDING COMPANY DOCUMENT
 * @param {import('express').Request<{companyUUID:string}>} req @param {import('express').Response} res @returns {Promise<void>}
 */
exports.retrievePendingCompanyDocument=async(req,res)=>{
 const functionName='retrievePendingCompanyDocument';
 try{
  const document=await service.retrievePendingCompanyDocument(requireAuth(req),req.params.companyUUID);
  const mime=document.companyDocumentMime;
  res.status(200).set({'Content-Type':mime,'Content-Disposition':`inline; filename="verification.${mime==='application/pdf'?'pdf':'jpg'}"`,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store'}).send(document.companyDocumentContent);
 }catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.SECURITY,'ERROR','Company document retrieval failed',source,functionName,req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/** APPROVE OR REJECT A COMPANY APPLICATION
 * @param {import('express').Request<{companyUUID:string},unknown,unknown>} req @param {import('express').Response} res @returns {Promise<void>}
 */
exports.decideCompanyVerification=async(req,res)=>{
 const functionName='decideCompanyVerification';
 try{
  const parsed=decisionSchema.safeParse(req.body);if(!parsed.success)throw new CustomModelError('CompanyVerificationDecision','Indica una decisión válida y un motivo breve para rechazar.');
  const decision=parsed.data.decision==='REJECTED'?{...parsed.data,reason:parsed.data.reason}:{...parsed.data,reason:null};
  const result=await service.decideCompanyVerification(requireAuth(req),req.params.companyUUID,decision);
  res.status(200).json({success:true,message:decision.decision==='APPROVED'?'Empresa aprobada.':'Solicitud rechazada.',data:result});
 }catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.SECURITY,'ERROR','Company verification decision failed',source,functionName,req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
