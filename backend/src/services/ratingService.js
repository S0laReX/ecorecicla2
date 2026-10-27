const Rating=require('../models/CollectionRating');
const {retryTransaction:transaction}=require('./transactionService');
const {lockSessionUser}=require('./sessionPolicy');
const {ratingInputSchema,ratingUUIDSchema}=require('../schemas/ratingSchema');
const CustomModelError=require('../utils/customModelError');

/** @typedef {import('./sessionPolicy').AuthContext} AuthContext */
/** @typedef {import('../models/User').UserContext} UserContext */
/** @param {UserContext} user */
function requireRatingRole(user){if(!['USER','COMPANY'].includes(user.userRoleCode))throw new CustomModelError('CollectionRating','Solo usuarios y empresas pueden calificar.','ROLE_FORBIDDEN',403);}
/** LIST CONFIRMED COLLECTIONS AWAITING A RATING @param {AuthContext} auth */
exports.listPending=async(auth)=>{
 return transaction(async connection=>{
  const user=await lockSessionUser(auth,connection);requireRatingRole(user);
  return {items:await Rating.findPendingByUser(user.userId,connection)};
 });
};
/** READ CURRENT USER RATING SUMMARY @param {AuthContext} auth */
exports.readMyProfileRating=async(auth)=>{
 return transaction(async connection=>{
  const user=await lockSessionUser(auth,connection);requireRatingRole(user);
  return await Rating.readAverageByUser(user.userId,connection);
 });
};
/** RATE THE OTHER PARTY IN A CONFIRMED COLLECTION @param {AuthContext} auth @param {string} reservationUUID @param {unknown} input */
exports.rateCollection=async(auth,reservationUUID,input)=>{
 if(!ratingUUIDSchema.safeParse(reservationUUID).success)throw new CustomModelError('CollectionRating','Identificador inválido.','VALIDATION_ERROR',422);
 const parsed=ratingInputSchema.safeParse(input);if(!parsed.success)throw new CustomModelError('CollectionRating','Selecciona de 1 a 5 estrellas.','VALIDATION_ERROR',422);
 let targetUserId='';let targetUserUUID='';
 try{
  const created=await transaction(async connection=>{
   const user=await lockSessionUser(auth,connection);requireRatingRole(user);
   const reservation=await Rating.findParticipation(reservationUUID,user.userId,connection);
   if(!reservation)throw new CustomModelError('CollectionReservation','Recolección no encontrada.','RESERVATION_NOT_FOUND',404);
   if(reservation.reservationStatus!=='CONFIRMADA')throw new CustomModelError('CollectionRating','Solo puedes calificar una recolección confirmada.','COLLECTION_NOT_CONFIRMED',409);
   targetUserId=reservation.companyUserId===user.userId?reservation.publisherUserId:reservation.companyUserId;
   targetUserUUID=reservation.companyUserId===user.userId?reservation.publisherUUID:reservation.companyUUID;
   const id=await Rating.create({reservationId:reservation.reservationId,raterUserId:user.userId,ratedUserId:targetUserId,score:parsed.data.score},connection);
   return {ratingUUID:id};
  });
  const profile=await Rating.readAverageByUser(targetUserId);
  return {reservationUUID,ratedUserUUID:targetUserUUID,score:parsed.data.score,createdAt:new Date().toISOString(),average:profile.average,count:profile.count};
 }catch(error){if(error instanceof Error&&'code' in error&&error.code==='ER_DUP_ENTRY')throw new CustomModelError('CollectionRating','Ya calificaste esta recolección.','RATING_ALREADY_EXISTS',409);throw error;}
};
