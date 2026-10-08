const {randomUUID}=require('node:crypto');
const {z}=require('zod');
const {uuidSchema,ownerIdSchema}=require('../schemas/publicationSchema');
const {modelGuard}=require('../utils/modelGuard');
const CustomModelError=require('../utils/customModelError');
/** @typedef {import('mysql2/promise').PoolConnection} Connection */
/** @typedef {{reservationUUID:string,reservationPublicationUUID:string,reservationScheduledAt:Date,reservationStatus:'ACEPTADA',publicationMaterialType:string,publicationQuantityKg:string,publicationLocationText:string,publicationAvailabilityText:string,publicationPhotoDataUrl:string,publisherName:string}} AgendaReservation */
const CollectionReservation={};
// READ
/** FIND A RESERVATION BY PUBLIC UUID AND OWNER
 * @param {string} reservationUUID @param {string} companyUserId @param {Connection} connection @param {boolean} [lock]
 * @returns {Promise<{reservationUUID:string,reservationPublicationUUID:string,reservationPublicationId:string,reservationCompanyUserId:string,reservationStatus:string}|null>}
 */
CollectionReservation.findByUUID=(reservationUUID,companyUserId,connection,lock=false)=>modelGuard('CollectionReservation','findByUUID',async()=>{
 if(!uuidSchema.safeParse(reservationUUID).success||!ownerIdSchema.safeParse(companyUserId).success)throw new CustomModelError('CollectionReservation','Identificadores inválidos.');
 const collectionReservationQuery=`SELECT C.internalUUID AS reservationUUID,P.internalUUID AS reservationPublicationUUID,
  CAST(C.publicationId AS CHAR) AS reservationPublicationId,CAST(C.companyUserId AS CHAR) AS reservationCompanyUserId,C.status AS reservationStatus
  FROM CollectionReservation C JOIN Publication P ON P.id=C.publicationId
  WHERE C.internalUUID = ? AND C.companyUserId = ? LIMIT 1${lock?' FOR UPDATE':''}`;
 const collectionReservationParams=[reservationUUID,companyUserId];const [reservations]=await connection.execute(collectionReservationQuery,collectionReservationParams);
 return /** @type {Array<import('mysql2').RowDataPacket & {reservationUUID:string,reservationPublicationUUID:string,reservationPublicationId:string,reservationCompanyUserId:string,reservationStatus:string}>} */(reservations)[0]||null;
});
/** LIST THE COMPANY'S ACTIVE COLLECTION AGENDA
 * @param {string} companyUserId @param {number} page @param {number} limit @param {Connection} connection
 * @returns {Promise<AgendaReservation[]>}
 */
CollectionReservation.findAgendaByCompany=(companyUserId,page,limit,connection)=>modelGuard('CollectionReservation','findAgendaByCompany',async()=>{
 if(!ownerIdSchema.safeParse(companyUserId).success||!Number.isSafeInteger(page)||page<1||page>100000||!Number.isSafeInteger(limit)||limit<1||limit>12)throw new CustomModelError('CollectionReservation','Paginación inválida.');
 const collectionReservationQuery=`SELECT C.internalUUID AS reservationUUID,P.internalUUID AS reservationPublicationUUID,
  C.scheduledAt AS reservationScheduledAt,C.status AS reservationStatus,P.materialType AS publicationMaterialType,
  CAST(P.quantityKg AS CHAR) AS publicationQuantityKg,P.locationText AS publicationLocationText,
  P.availabilityText AS publicationAvailabilityText,
  CONCAT('data:image/jpeg;base64,',REPLACE(TO_BASE64(P.photoJpeg),CHAR(10),'')) AS publicationPhotoDataUrl,
  U.displayName AS publisherName FROM CollectionReservation C
  JOIN Publication P ON P.id=C.publicationId JOIN User U ON U.id=P.ownerId
  WHERE C.companyUserId = ? AND C.status = ? AND P.deletedAt IS NULL
  ORDER BY C.scheduledAt ASC,C.id ASC LIMIT ? OFFSET ?`;
 const collectionReservationParams=[companyUserId,'ACEPTADA',String(limit),String((page-1)*limit)];const [reservations]=await connection.execute(collectionReservationQuery,collectionReservationParams);
 return /** @type {Array<import('mysql2').RowDataPacket & AgendaReservation>} */(reservations);
});
/** COUNT THE COMPANY'S ACTIVE COLLECTION AGENDA
 * @param {string} companyUserId @param {Connection} connection @returns {Promise<number>}
 */
CollectionReservation.readAgendaCountByCompany=(companyUserId,connection)=>modelGuard('CollectionReservation','readAgendaCountByCompany',async()=>{
 if(!ownerIdSchema.safeParse(companyUserId).success)throw new CustomModelError('CollectionReservation','Identidad inválida.');
 const collectionReservationQuery='SELECT COUNT(C.id) AS reservationCount FROM CollectionReservation C WHERE C.companyUserId = ? AND C.status = ?';
 const collectionReservationParams=[companyUserId,'ACEPTADA'];const [reservations]=await connection.execute(collectionReservationQuery,collectionReservationParams);
 return Number(/** @type {import('mysql2').RowDataPacket[]} */(reservations)[0].reservationCount);
});
// CREATE
/** CREATE A RESERVATION IN THE CALLER'S TRANSACTION
 * @param {{reservationUUID?:string,publicationId:string,companyUserId:string,scheduledAt:Date}} data @param {Connection} connection @returns {Promise<string>}
 */
CollectionReservation.create=(data,connection)=>modelGuard('CollectionReservation','create',async()=>{
 const parsed=z.object({reservationUUID:uuidSchema.optional(),publicationId:ownerIdSchema,companyUserId:ownerIdSchema,scheduledAt:z.date()}).strict().safeParse(data);
 if(!parsed.success||!Number.isFinite(data.scheduledAt.getTime()))throw new CustomModelError('CollectionReservation','Datos de reserva inválidos.');
 const reservationUUID=data.reservationUUID||randomUUID();
 const collectionReservationQuery='INSERT INTO CollectionReservation (internalUUID,publicationId,companyUserId,scheduledAt,status) VALUES (?,?,?,?,?)';
 const collectionReservationParams=[reservationUUID,data.publicationId,data.companyUserId,data.scheduledAt,'ACEPTADA'];
 await connection.execute(collectionReservationQuery,collectionReservationParams);return reservationUUID;
});
// UPDATE
/** CANCEL AN ACTIVE RESERVATION OWNED BY THE COMPANY
 * @param {string} reservationUUID @param {string} companyUserId @param {Connection} connection @returns {Promise<void>}
 */
CollectionReservation.cancelByUUID=(reservationUUID,companyUserId,connection)=>modelGuard('CollectionReservation','cancelByUUID',async()=>{
 if(!uuidSchema.safeParse(reservationUUID).success||!ownerIdSchema.safeParse(companyUserId).success)throw new CustomModelError('CollectionReservation','Identificadores inválidos.');
 const collectionReservationQuery='UPDATE CollectionReservation SET status = ?, updatedAt = UTC_TIMESTAMP(3) WHERE internalUUID = ? AND companyUserId = ? AND status = ?';
 const collectionReservationParams=['CANCELADA',reservationUUID,companyUserId,'ACEPTADA'];const [updated]=await connection.execute(collectionReservationQuery,collectionReservationParams);
 if(/** @type {import('mysql2').ResultSetHeader} */(updated).affectedRows!==1)throw new CustomModelError('CollectionReservation','La reserva ya no está activa. Actualiza la agenda.','RESERVATION_CONFLICT',409);
});
module.exports=CollectionReservation;
