const Notice=require('../models/Notice');
const Reservation=require('../models/CollectionReservation');const Publication=require('../models/Publication');const Award=require('../models/CollectionPointAward');
const {retryTransaction:transaction}=require('./transactionService');const {lockSessionUser}=require('./sessionPolicy');
const {uuidSchema}=require('../schemas/publicationSchema');const CustomModelError=require('../utils/customModelError');
const MaterialPointSetting=require('../models/MaterialPointSetting');
/** CONFIRM AND AWARD BOTH PARTIES EXACTLY ONCE IN ONE TRANSACTION
 * @param {import('./sessionPolicy').AuthContext} auth @param {string} reservationUUID
 */
exports.confirmReservation=async(auth,reservationUUID)=>{
 if(!uuidSchema.safeParse(reservationUUID).success)throw new CustomModelError('CollectionReservation','Identificador inválido.','VALIDATION_ERROR',422);
 const result=await transaction(async connection=>{
  const user=await lockSessionUser(auth,connection);
  if(user.userRoleCode!=='COMPANY'||user.userVerificationStatus!=='APPROVED')throw new CustomModelError('User','Solo una empresa aprobada puede confirmar.','ROLE_FORBIDDEN',403);
  const current=await Reservation.findByUUID(reservationUUID,user.userId,connection);
  if(!current)throw new CustomModelError('CollectionReservation','Reserva no encontrada.','RESERVATION_NOT_FOUND',404);
  const publication=await Publication.findReservableByUUID(current.reservationPublicationUUID,connection);
  const reservation=await Reservation.findByUUID(reservationUUID,user.userId,connection,true);
  if(!reservation||reservation.reservationStatus!=='ACEPTADA'||publication?.publicationStatus!=='aceptada')throw new CustomModelError('CollectionReservation','La reserva fue cancelada, venció o ya está confirmada.','RESERVATION_CONFLICT',409);
  const now=await Reservation.readNow(connection);
  if(!reservation.reservationExpiresAt)throw new CustomModelError('CollectionReservation','La reserva no tiene un horario válido.','RESERVATION_WINDOW_INVALID',409);
  if(now>reservation.reservationExpiresAt){
   await Reservation.finish(reservationUUID,user.userId,'VENCIDA',now,connection);
   await Publication.changeReservationStatus(publication.publicationUUID,'aceptada','disponible',connection);
   return null; // Commit release BEFORE returning the safe expiration error.
  }
  if(now<reservation.reservationScheduledAt)throw new CustomModelError('CollectionReservation','Todavía no comenzó el horario acordado.','CONFIRMATION_TOO_EARLY',409);
  const points=await MaterialPointSetting.readEffective(publication.publicationMaterialType,connection);
  await Reservation.finish(reservationUUID,user.userId,'CONFIRMADA',now,connection);
  await Publication.changeReservationStatus(publication.publicationUUID,'aceptada','confirmada',connection);
  await Award.create({reservationId:reservation.reservationId,recipientUserId:publication.publicationOwnerId,recipientRole:'PUBLISHER',points:points.publisher},connection);
  await Award.create({reservationId:reservation.reservationId,recipientUserId:user.userId,recipientRole:'COLLECTOR',points:points.collector},connection);
  for(const recipientUserId of [publication.publicationOwnerId,user.userId]){
   await Notice.create({recipientUserId,kind:'CONFIRMED',eventUUID:reservationUUID,title:'Recolección confirmada',body:'La recolección se completó. Puedes consultar los puntos obtenidos en tu perfil.'},connection);
   await Notice.create({recipientUserId,kind:'RATE',eventUUID:reservationUUID,title:'¡Califica tu experiencia!',body:'Tu recolección fue completada. Comparte tu valoración de la otra parte.'},connection);
  }
  return {reservationUUID,publicationUUID:publication.publicationUUID,publicationStatus:'confirmada',confirmedAt:now.toISOString(),publisherPoints:points.publisher,collectorPoints:points.collector};
 });
 if(!result)throw new CustomModelError('CollectionReservation','El horario venció. La publicación volvió a estar disponible sin penalización.','RESERVATION_EXPIRED',409);
 return result;
};
