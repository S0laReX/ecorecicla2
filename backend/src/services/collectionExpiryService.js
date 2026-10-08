const Reservation=require('../models/CollectionReservation');const Publication=require('../models/Publication');
const {retryTransaction:transaction}=require('./transactionService');
const {AuditService}=require('./auditService');const {LogCategory}=require('../utils/logCategories');
/** RELEASE EXPIRED RESERVATIONS WITHOUT PENALTIES OR POINTS.
 * Lock order: publication, reservation. Recheck after locking to handle races with confirmation/cancellation.
 * @returns {Promise<number>}
 */
async function expireReservations(){
 let expired=0;let candidates;
 do{
 candidates=await transaction(connection=>Reservation.findExpired(connection));
 for(const candidate of candidates)expired+=await transaction(async connection=>{
  const publication=await Publication.findReservableByUUID(candidate.publicationUUID,connection);
  const reservation=await Reservation.findByUUID(candidate.reservationUUID,candidate.companyUserId,connection,true);
  const now=await Reservation.readNow(connection);
  if(!reservation||reservation.reservationStatus!=='ACEPTADA'||!reservation.reservationExpiresAt||reservation.reservationExpiresAt>=now)return 0;
  await Reservation.finish(candidate.reservationUUID,candidate.companyUserId,'VENCIDA',now,connection);
  if(publication?.publicationStatus==='aceptada')await Publication.changeReservationStatus(publication.publicationUUID,'aceptada','disponible',connection);
  return 1;
 });
 }while(candidates.length===100);
 return expired;
}
/** @type {Promise<number>|null} */
let running=null;
/** COALESCE SIMULTANEOUS READ-TIME CLEANUPS @returns {Promise<number>} */
function releaseExpiredReservations(){
 if(!running)running=expireReservations().finally(()=>{running=null;});
 return running;
}
/** PERIODIC CLEANUP, INCLUDING WHEN NO CLIENT IS CONNECTED @returns {()=>void} */
function startExpiryWorker(){
 const tick=()=>{void releaseExpiredReservations().catch(()=>AuditService.logSystem(LogCategory.STABILITY,'ERROR','Collection expiry sweep failed','collectionExpiryService.js','startExpiryWorker',null));};
 const timer=setInterval(tick,30000);timer.unref();tick();return()=>clearInterval(timer);
}
module.exports={releaseExpiredReservations,startExpiryWorker};
