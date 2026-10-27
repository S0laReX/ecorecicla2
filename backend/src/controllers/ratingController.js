const service=require('../services/ratingService');
const {ratingInputSchema,ratingUUIDSchema}=require('../schemas/ratingSchema');
const CustomModelError=require('../utils/customModelError');
const {apiError}=require('../utils/apiError');
const {AuditService}=require('../services/auditService');
const {LogCategory}=require('../utils/logCategories');
const source='ratingController.js';
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('express').Request<{reservationUUID:string}>} RatingRequest */
/** @param {Request} req @returns {import('../services/sessionPolicy').AuthContext} */
function requireAuth(req){if(!req.auth)throw new CustomModelError('User','Inicia sesión.','AUTH_REQUIRED',401);return req.auth;}
/** LIST CURRENT USER'S PENDING RATINGS @param {Request} req @param {Response} res */
exports.listPending=async(req,res)=>{try{const data=await service.listPending(requireAuth(req));res.status(200).json({success:true,message:'Calificaciones pendientes recuperadas.',data});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Pending ratings lookup failed',source,'listPending',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}};
/** READ THE AUTHENTICATED PROFILE RATING SUMMARY @param {Request} req @param {Response} res */
exports.readMyProfileRating=async(req,res)=>{try{const data=await service.readMyProfileRating(requireAuth(req));res.status(200).json({success:true,message:'Calificación del perfil recuperada.',data});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Profile rating lookup failed',source,'readMyProfileRating',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}};
/** RATE THE OTHER PARTY IN A CONFIRMED COLLECTION @param {RatingRequest} req @param {Response} res */
exports.rateCollection=async(req,res)=>{try{if(!ratingUUIDSchema.safeParse(req.params.reservationUUID).success||!ratingInputSchema.safeParse(req.body).success)throw new CustomModelError('CollectionRating','Envía una calificación entera entre 1 y 5.','VALIDATION_ERROR',422);
 const data=await service.rateCollection(requireAuth(req),req.params.reservationUUID,req.body);res.status(201).json({success:true,message:'Calificación guardada.',data});}
 catch(error){const failure=apiError(error);await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Collection rating failed',source,'rateCollection',req.ip||null,{requestId:req.requestId,errorCode:failure.errorCode});res.status(failure.statusCode).json(failure);}};
