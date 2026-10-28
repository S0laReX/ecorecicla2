const Notice=require('../models/Notice');
const Publication=require('../models/Publication');
const CollectionReservation=require('../models/CollectionReservation');
const {retryTransaction:transaction}=require('./transactionService');
const {lockSessionUser}=require('./sessionPolicy');
const CustomModelError=require('../utils/customModelError');
const {acceptReservationSchema,reservationUUIDSchema}=require('../schemas/reservationSchema');
const {isWithinAvailabilityWindow,reservationExpiry}=require('../utils/availabilityWindow');
const {releaseExpiredReservations}=require('./collectionExpiryService');
/** REQUIRE AN ACTIVE, APPROVED COLLECTOR IN THE CURRENT TRANSACTION
 * @param {import('./sessionPolicy').AuthContext} auth @param {import('mysql2/promise').PoolConnection} connection
 * @returns {Promise<import('../models/User').UserContext>}
 */
async function requireCollector(auth,connection){
 const user=await lockSessionUser(auth,connection);
 if(user.userRoleCode!=='COMPANY')throw new CustomModelError('User','Solo las empresas recolectoras pueden reservar materiales.','ROLE_FORBIDDEN',403);
 if(user.userVerificationStatus!=='APPROVED')throw new CustomModelError('User','Tu empresa necesita aprobación para reservar materiales.','COMPANY_PENDING',403);
 return user;
}
/** ACCEPT AN AVAILABLE PUBLICATION FOR A FUTURE SCHEDULE
 * The publication row is locked before a reservation is written; the active-publication
 * unique key is a second database-level guard against concurrent acceptance.
 * @param {import('./sessionPolicy').AuthContext} auth @param {string} publicationUUID @param {unknown} input
 * @returns {Promise<{reservationUUID:string,publicationUUID:string,scheduledAt:string}>}
 */
exports.acceptPublication=async(auth,publicationUUID,input)=>{
 if(!reservationUUIDSchema.safeParse(publicationUUID).success)throw new CustomModelError('Publication','Identificador inválido.','VALIDATION_ERROR',422);
 const parsed=acceptReservationSchema.safeParse(input);
 if(!parsed.success)throw new CustomModelError('CollectionReservation','Selecciona una fecha y hora válidas.','VALIDATION_ERROR',422);
 await releaseExpiredReservations();
 const scheduledAt=new Date(parsed.data.scheduledAt);
 if(!Number.isFinite(scheduledAt.getTime())||scheduledAt.getTime()<=Date.now())throw new CustomModelError('CollectionReservation','La fecha y hora de recolección deben ser futuras.','SCHEDULE_IN_PAST',422);
 try{
  return await transaction(async connection=>{
   const collector=await requireCollector(auth,connection);
   const publication=await Publication.findReservableByUUID(publicationUUID,connection);
   if(!publication||publication.publicationOwnerId===collector.userId)throw new CustomModelError('Publication','La publicación ya no está disponible. Actualiza el listado.','PUBLICATION_NOT_FOUND',404);
   if(publication.publicationStatus!=='disponible')throw new CustomModelError('Publication','Otra empresa ya reservó esta publicación. Actualiza el listado.','RESERVATION_CONFLICT',409);
   const scheduleFitsWindow=isWithinAvailabilityWindow(publication.publicationAvailabilityText,scheduledAt);
   if(scheduleFitsWindow===null)throw new CustomModelError('Publication','El horario publicado debe incluir días de la semana y un rango HH:mm-HH:mm para poder validarlo.','AVAILABILITY_WINDOW_UNVERIFIABLE',422);
   if(!scheduleFitsWindow)throw new CustomModelError('CollectionReservation','El horario elegido está fuera de la disponibilidad publicada.','SCHEDULE_OUTSIDE_WINDOW',422);
   const expiresAt=reservationExpiry(publication.publicationAvailabilityText,scheduledAt);
   if(!expiresAt)throw new CustomModelError('CollectionReservation','Horario inválido.');
   await Publication.changeReservationStatus(publicationUUID,'disponible','aceptada',connection);
   const reservationUUID=await CollectionReservation.create({publicationId:publication.publicationId,companyUserId:collector.userId,scheduledAt,expiresAt},connection);
   await Notice.create({recipientUserId:publication.publicationOwnerId,kind:'ACCEPTED',eventUUID:reservationUUID,title:'Tu publicación fue aceptada',body:'Una empresa reservó tus materiales. Consulta tus publicaciones para ver su estado.'},connection);
   return {reservationUUID,publicationUUID,scheduledAt:scheduledAt.toISOString()};
  });
 }catch(error){
  if(error&&typeof error==='object'&&'code'in error&&error.code==='ER_DUP_ENTRY')throw new CustomModelError('CollectionReservation','Otra empresa ya reservó esta publicación. Actualiza el listado.','RESERVATION_CONFLICT',409);
  throw error;
 }
};
/** LIST A COMPANY'S ACTIVE AGENDA
 * @param {import('./sessionPolicy').AuthContext} auth @param {number} page @param {number} limit
 */
exports.listAgenda=async(auth,page,limit)=>{await releaseExpiredReservations();return transaction(async connection=>{
 const collector=await requireCollector(auth,connection);
 const total=await CollectionReservation.readAgendaCountByCompany(collector.userId,connection);
 const reservations=await CollectionReservation.findAgendaByCompany(collector.userId,page,limit,connection);
 return {reservations:reservations.map(reservation=>({...reservation,reservationScheduledAt:new Date(reservation.reservationScheduledAt).toISOString(),reservationExpiresAt:new Date(reservation.reservationExpiresAt).toISOString()})),meta:{total,page,limit}};
});};
/** CANCEL AN ACTIVE RESERVATION AND RETURN ITS PUBLICATION TO AVAILABLE
 * Lock order is Publication then CollectionReservation, matching acceptance and avoiding deadlocks.
 * @param {import('./sessionPolicy').AuthContext} auth @param {string} reservationUUID
 * @returns {Promise<{reservationUUID:string,publicationUUID:string,publicationStatus:'disponible'}>}
 */
exports.cancelReservation=async(auth,reservationUUID)=>{
 if(!reservationUUIDSchema.safeParse(reservationUUID).success)throw new CustomModelError('CollectionReservation','Identificador inválido.','VALIDATION_ERROR',422);
 await releaseExpiredReservations();
 return transaction(async connection=>{
  const collector=await requireCollector(auth,connection);
  const current=await CollectionReservation.findByUUID(reservationUUID,collector.userId,connection);
  if(!current)throw new CustomModelError('CollectionReservation','La reserva no existe.','RESERVATION_NOT_FOUND',404);
  if(current.reservationStatus!=='ACEPTADA')throw new CustomModelError('CollectionReservation','La reserva ya fue cancelada y no se puede volver a cancelar.','RESERVATION_CONFLICT',409);
  const publication=await Publication.findReservableByUUID(current.reservationPublicationUUID,connection);
  if(!publication||publication.publicationStatus!=='aceptada')throw new CustomModelError('CollectionReservation','La reserva cambió de estado. Actualiza la agenda.','RESERVATION_CONFLICT',409);
  const locked=await CollectionReservation.findByUUID(reservationUUID,collector.userId,connection,true);
  if(!locked||locked.reservationStatus!=='ACEPTADA')throw new CustomModelError('CollectionReservation','La reserva cambió de estado. Actualiza la agenda.','RESERVATION_CONFLICT',409);
  await CollectionReservation.cancelByUUID(reservationUUID,collector.userId,connection);
  await Publication.changeReservationStatus(publication.publicationUUID,'aceptada','disponible',connection);
  return {reservationUUID,publicationUUID:publication.publicationUUID,publicationStatus:'disponible'};
 });
};
