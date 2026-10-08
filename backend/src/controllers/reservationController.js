const service=require('../services/reservationService');
const {agendaQuerySchema,reservationUUIDSchema}=require('../schemas/reservationSchema');
const CustomModelError=require('../utils/customModelError');
const {apiError}=require('../utils/apiError');
const {AuditService}=require('../services/auditService');
const {LogCategory}=require('../utils/logCategories');
const source='reservationController.js';
/** CONFIRM A COLLECTED MATERIAL — no client-supplied timestamps or points accepted.
 * @param {import('express').Request<{reservationUUID:string}>} req @param {import('express').Response} res @returns {Promise<void>}
 */
exports.confirmReservation=async(req,res)=>{
 try{
  if(req.body!==undefined&&(!req.body||typeof req.body!=='object'||Array.isArray(req.body)||Object.keys(req.body).length))throw new CustomModelError('CollectionReservation','La confirmación no admite datos adicionales.','VALIDATION_ERROR',422);
  const data=await require('../services/confirmationService').confirmReservation(requireAuth(req),req.params.reservationUUID);
  res.status(200).json({success:true,message:'Recolección confirmada. Se otorgaron puntos a ambas partes.',data});
 }catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Collection confirmation failed',source,'confirmReservation',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/** REQUIRE VERIFIED AUTH CONTEXT @param {import('express').Request} req @returns {import('../services/sessionPolicy').AuthContext} */
function requireAuth(req){if(!req.auth)throw new CustomModelError('User','Inicia sesión.','AUTH_REQUIRED',401);return req.auth;}
/** ACCEPT A PUBLICATION AND SELECT ITS COLLECTION SCHEDULE
 * @param {import('express').Request<{publicationUUID:string},unknown,unknown>} req @param {import('express').Response} res @returns {Promise<void>}
 */
exports.acceptPublication=async(req,res)=>{
 try{const data=await service.acceptPublication(requireAuth(req),req.params.publicationUUID,req.body);res.status(201).json({success:true,message:'Recolección agendada correctamente.',data});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Could not accept collection publication',source,'acceptPublication',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/** LIST THE AUTHORIZED COMPANY AGENDA
 * @param {import('express').Request} req @param {import('express').Response} res @returns {Promise<void>}
 */
exports.listAgenda=async(req,res)=>{
 try{const auth=requireAuth(req);const parsed=agendaQuerySchema.safeParse(req.query);if(!parsed.success)throw new CustomModelError('CollectionReservation','Revisa la paginación de la agenda.','VALIDATION_ERROR',422);
  const data=await service.listAgenda(auth,parsed.data.page,parsed.data.limit);res.status(200).json({success:true,message:'Agenda recuperada.',data});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Collection agenda lookup failed',source,'listAgenda',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
/** CANCEL AN ACTIVE COLLECTION RESERVATION
 * @param {import('express').Request<{reservationUUID:string}>} req @param {import('express').Response} res @returns {Promise<void>}
 */
exports.cancelReservation=async(req,res)=>{
 try{const auth=requireAuth(req);if(!reservationUUIDSchema.safeParse(req.params.reservationUUID).success)throw new CustomModelError('CollectionReservation','Identificador inválido.','VALIDATION_ERROR',422);
  const data=await service.cancelReservation(auth,req.params.reservationUUID);res.status(200).json({success:true,message:'Reserva cancelada; la publicación volvió a estar disponible.',data});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Collection reservation cancellation failed',source,'cancelReservation',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}
};
