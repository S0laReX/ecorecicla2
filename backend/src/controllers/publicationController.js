const {publicationFieldsSchema,uuidSchema} = require('../schemas/publicationSchema');
const {createPublicationForUser} = require('../services/publicationService');
const CustomModelError = require('../utils/customModelError');
const {apiError} = require('../utils/apiError');
const {AuditService} = require('../services/auditService');
const {LogCategory} = require('../utils/logCategories');
const source = 'publicationController.js';
const {z}=require('zod');
const service=require('../services/publicationService');
/** REQUIRE VERIFIED AUTH CONTEXT @param {import('express').Request} req @returns {import('../services/sessionPolicy').AuthContext} */
function requireAuth(req){if(!req.auth)throw new CustomModelError('User','Inicia sesión.','AUTH_REQUIRED',401);return req.auth;}
/** LIST OWN PUBLICATIONS
 * @param {import('express').Request} req @param {import('express').Response} res @returns {Promise<void>}
 */
exports.listOwnPublications=async(req,res)=>{
 try{const query=z.object({page:z.coerce.number().int().min(1).max(100000).default(1),limit:z.coerce.number().int().min(1).max(12).default(6)}).strict().safeParse(req.query);
 if(!query.success)throw new CustomModelError('Publication','Paginación inválida.');
 const result=await service.listOwnPublications(requireAuth(req),query.data.page,query.data.limit);
 res.status(200).json({success:true,message:'Publicaciones recuperadas.',data:result.publications,meta:result.meta});
 }catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Publication list failed',source,'listOwnPublications',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/** RETRIEVE OWN PUBLICATION
 * @param {import('express').Request<{publicationUUID:string}>} req @param {import('express').Response} res @returns {Promise<void>}
 */
exports.retrievePublication=async(req,res)=>{
 try{const publication=await service.retrieveOwnPublication(requireAuth(req),req.params.publicationUUID);res.status(200).json({success:true,message:'Publicación recuperada.',data:publication});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Publication retrieval failed',source,'retrievePublication',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/** UPDATE OWN AVAILABLE PUBLICATION
 * @param {import('express').Request<{publicationUUID:string},unknown,unknown>} req @param {import('express').Response} res @returns {Promise<void>}
 */
exports.updatePublication=async(req,res)=>{
 try{const publication=await service.updateOwnPublication(requireAuth(req),req.params.publicationUUID,req.body,req.file);res.status(200).json({success:true,message:'Publicación actualizada.',data:publication});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Publication update failed',source,'updatePublication',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/** DELETE OWN AVAILABLE PUBLICATION
 * @param {import('express').Request<{publicationUUID:string}>} req @param {import('express').Response} res @returns {Promise<void>}
 */
exports.deletePublication=async(req,res)=>{
 try{const publication=await service.deleteOwnPublication(requireAuth(req),req.params.publicationUUID);res.status(200).json({success:true,message:'Publicación eliminada.',data:publication});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Publication deletion failed',source,'deletePublication',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/**
 * CREATE PUBLICATION
 * POST /api/publications — authenticated multipart/form-data.
 * Identity comes only from verified middleware. Service checks current role/status under lock.
 * @param {import('express').Request<Record<string,string>,unknown,unknown>} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.createPublication = async (req,res) => {
  const functionName = 'createPublication';
  try {
    const auth = req.auth;
    if (!auth || !uuidSchema.safeParse(auth.userUUID).success || !Number.isSafeInteger(auth.tokenVersion) || auth.tokenVersion<0)
      throw new CustomModelError('User','Inicia sesión para continuar.','AUTH_REQUIRED',401);
    const parsed = publicationFieldsSchema.safeParse(req.body);
    if (!parsed.success) throw new CustomModelError('Publication','Revisa tipo, cantidad, ubicación y horario.','VALIDATION_ERROR',422);
    const publication = await createPublicationForUser(auth,parsed.data,req.file);
    res.status(201).json({success:true,message:'Publicación creada correctamente.',data:publication});
  } catch (error) {
    const failure = apiError(error);
    await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Could not create publication',source,functionName,req.ip || null,
      {requestId:req.requestId,errorCode:failure.errorCode,statusCode:failure.statusCode});
    res.status(failure.statusCode).json(failure);
  }
};
