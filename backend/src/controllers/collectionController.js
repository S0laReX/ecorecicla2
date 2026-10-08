const {collectionQuerySchema}=require('../schemas/collectionSchema');
const {uuidSchema}=require('../schemas/publicationSchema');
const service=require('../services/collectionService');
const CustomModelError=require('../utils/customModelError');
const {apiError}=require('../utils/apiError');
const {AuditService}=require('../services/auditService');
const {LogCategory}=require('../utils/logCategories');
/** LIST AVAILABLE PUBLICATIONS — GET /api/collections/publications
 * Identity is supplied by authenticate; current role is checked by the service.
 * @param {import('express').Request} req @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.listAvailablePublications=async(req,res)=>{
 try{
  if(!req.auth)throw new CustomModelError('User','Inicia sesión.','AUTH_REQUIRED',401);
  const query=collectionQuerySchema.safeParse(req.query);
  if(!query.success)throw new CustomModelError('Publication','Revisa el material y la paginación.','VALIDATION_ERROR',422);
  const data=await service.listAvailablePublications(req.auth,query.data);
  res.status(200).json({success:true,message:'Publicaciones disponibles recuperadas.',data});
 }catch(error){
  const failure=apiError(error);
  await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Available publications lookup failed','collectionController.js','listAvailablePublications',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});
  res.status(failure.statusCode).json(failure);
 }
};
/** RETRIEVE AVAILABLE PUBLICATION — GET /api/collections/publications/:publicationUUID
 * Own, deleted or non-available publications are deliberately indistinguishable.
 * @param {import('express').Request<{publicationUUID:string}>} req @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.retrieveAvailablePublication=async(req,res)=>{
 try{
  if(!req.auth)throw new CustomModelError('User','Inicia sesión.','AUTH_REQUIRED',401);
  if(!uuidSchema.safeParse(req.params.publicationUUID).success)throw new CustomModelError('Publication','Identificador inválido.','VALIDATION_ERROR',422);
  const data=await service.retrieveAvailablePublication(req.auth,req.params.publicationUUID);
  res.status(200).json({success:true,message:'Detalle recuperado.',data});
 }catch(error){
  const failure=apiError(error);
  await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Available publication detail failed','collectionController.js','retrieveAvailablePublication',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});
  res.status(failure.statusCode).json(failure);
 }
};
