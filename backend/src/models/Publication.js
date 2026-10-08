const {randomUUID} = require('node:crypto');
const {pool} = require('../config/database');
const CustomModelError = require('../utils/customModelError');
const {publicationFieldsSchema,ownerIdSchema,uuidSchema,photoSchema} = require('../schemas/publicationSchema');
const {AuditService} = require('../services/auditService');
const {LogCategory} = require('../utils/logCategories');
/** @typedef {import('zod').infer<typeof publicationFieldsSchema>} PublicationFields */
/** @typedef {{publicationUUID:string,publicationMaterialType:string,publicationQuantityKg:string,publicationLocationText:string,publicationAvailabilityText:string,publicationStatus:'disponible'|'aceptada'|'confirmada',publicationPhotoDataUrl:string}} PublicationRecord */
const source = 'Publication.js';
const Publication = {};
const {collectionQuerySchema}=require('../schemas/collectionSchema');
/** @typedef {import('zod').infer<typeof collectionQuerySchema>} CollectionQuery */
/** @typedef {PublicationRecord & {publisherName:string}} AvailablePublication */
const availableSelection=`P.internalUUID AS publicationUUID, P.materialType AS publicationMaterialType,
 CAST(P.quantityKg AS CHAR) AS publicationQuantityKg, P.locationText AS publicationLocationText,
 P.availabilityText AS publicationAvailabilityText, P.status AS publicationStatus,
 CONCAT('data:image/jpeg;base64,',REPLACE(TO_BASE64(P.photoJpeg),CHAR(10),'')) AS publicationPhotoDataUrl,
 U.displayName AS publisherName`;
const availableWhere='P.ownerId <> ? AND P.status = ? AND P.deletedAt IS NULL AND U.deletedAt IS NULL';
// READ
/** COUNT AVAILABLE THIRD-PARTY PUBLICATIONS
 * @param {string} viewerId @param {CollectionQuery} query @param {import('mysql2/promise').PoolConnection} connection
 * @returns {Promise<number>}
 */
Publication.readAvailableCount=async(viewerId,query,connection)=>{
 try{
  if(!ownerIdSchema.safeParse(viewerId).success||!collectionQuerySchema.safeParse(query).success)throw new CustomModelError('Publication','Filtros inválidos.');
  const publicationQuery=`SELECT COUNT(P.id) AS publicationCount FROM Publication P JOIN User U ON U.id=P.ownerId
   WHERE ${availableWhere}${query.materialType?' AND P.materialType = ?':''}`;
  const publicationParams=[viewerId,'disponible',...(query.materialType?[query.materialType]:[])];
  const [rows]=await connection.execute(publicationQuery,publicationParams);
  return Number(/** @type {import('mysql2').RowDataPacket[]} */(rows)[0].publicationCount);
 }catch(error){await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Available publication count failed',source,'readAvailableCount',null);throw error;}
};
/** COUNT OWN PUBLICATIONS @param {string} ownerId @param {import('mysql2/promise').PoolConnection} connection @returns {Promise<number>} */
Publication.readCountByOwner=async(ownerId,connection)=>{
 try{if(!ownerIdSchema.safeParse(ownerId).success)throw new CustomModelError('Publication','Identidad inválida.');
 const publicationQuery='SELECT COUNT(P.id) AS publicationCount FROM Publication P WHERE P.ownerId = ? AND P.deletedAt IS NULL';
 const publicationParams=[ownerId];const [publications]=await connection.execute(publicationQuery,publicationParams);
 return Number(/** @type {import('mysql2').RowDataPacket[]} */(publications)[0].publicationCount);
 }catch(error){await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Publication count failed',source,'readCountByOwner',null);throw error;}
};
// FIND
/** FIND AVAILABLE THIRD-PARTY PUBLICATIONS, MOST RECENT FIRST
 * @param {string} viewerId @param {CollectionQuery} query @param {import('mysql2/promise').PoolConnection} connection
 * @returns {Promise<AvailablePublication[]>}
 */
Publication.findAvailable=async(viewerId,query,connection)=>{
 try{
  if(!ownerIdSchema.safeParse(viewerId).success||!collectionQuerySchema.safeParse(query).success)throw new CustomModelError('Publication','Filtros inválidos.');
  const publicationQuery=`SELECT ${availableSelection} FROM Publication P JOIN User U ON U.id=P.ownerId
   WHERE ${availableWhere}${query.materialType?' AND P.materialType = ?':''}
   ORDER BY P.createdAt DESC,P.id DESC LIMIT ? OFFSET ?`;
  const publicationParams=[viewerId,'disponible',...(query.materialType?[query.materialType]:[]),String(query.limit),String((query.page-1)*query.limit)];
  const [rows]=await connection.execute(publicationQuery,publicationParams);
  return /** @type {Array<import('mysql2').RowDataPacket & AvailablePublication>} */(rows);
 }catch(error){await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Available publication list failed',source,'findAvailable',null);throw error;}
};
/** FIND AVAILABLE DETAIL WITH THE SAME VISIBILITY RULES AS THE LIST
 * @param {string} publicationUUID @param {string} viewerId @param {import('mysql2/promise').PoolConnection} connection
 * @returns {Promise<AvailablePublication|null>}
 */
Publication.findAvailableByUUID=async(publicationUUID,viewerId,connection)=>{
 try{
  if(!uuidSchema.safeParse(publicationUUID).success||!ownerIdSchema.safeParse(viewerId).success)throw new CustomModelError('Publication','Identificadores inválidos.');
  const publicationQuery=`SELECT ${availableSelection} FROM Publication P JOIN User U ON U.id=P.ownerId
   WHERE ${availableWhere} AND P.internalUUID = ? LIMIT 1`;
  const publicationParams=[viewerId,'disponible',publicationUUID];
  const [rows]=await connection.execute(publicationQuery,publicationParams);
  return /** @type {Array<import('mysql2').RowDataPacket & AvailablePublication>} */(rows)[0]||null;
 }catch(error){await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Available publication detail failed',source,'findAvailableByUUID',null);throw error;}
};
/** FIND A PUBLICATION ROW FOR AN EXCLUSIVE RESERVATION
 * @param {string} publicationUUID @param {import('mysql2/promise').PoolConnection} connection
 * @returns {Promise<{publicationId:string,publicationUUID:string,publicationOwnerId:string,publicationStatus:string,publicationAvailabilityText:string}|null>}
 */
Publication.findReservableByUUID=async(publicationUUID,connection)=>{
 try{
  if(!uuidSchema.safeParse(publicationUUID).success)throw new CustomModelError('Publication','Identificador inválido.');
  const publicationQuery=`SELECT CAST(P.id AS CHAR) AS publicationId,P.internalUUID AS publicationUUID,
   CAST(P.ownerId AS CHAR) AS publicationOwnerId,P.status AS publicationStatus,
   P.availabilityText AS publicationAvailabilityText
   FROM Publication P JOIN User U ON U.id=P.ownerId
   WHERE P.internalUUID = ? AND P.deletedAt IS NULL AND U.deletedAt IS NULL LIMIT 1 FOR UPDATE`;
  const publicationParams=[publicationUUID];const [publications]=await connection.execute(publicationQuery,publicationParams);
  return /** @type {Array<import('mysql2').RowDataPacket & {publicationId:string,publicationUUID:string,publicationOwnerId:string,publicationStatus:string,publicationAvailabilityText:string}>} */(publications)[0]||null;
 }catch(error){await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Reservable publication lookup failed',source,'findReservableByUUID',null);throw error;}
};
/** CHANGE PUBLICATION AVAILABILITY STATE WITH AN EXPECTED CURRENT STATE
 * @param {string} publicationUUID @param {'disponible'|'aceptada'} expectedStatus
 * @param {'disponible'|'aceptada'} nextStatus @param {import('mysql2/promise').PoolConnection} connection
 * @returns {Promise<void>}
 */
Publication.changeReservationStatus=async(publicationUUID,expectedStatus,nextStatus,connection)=>{
 try{
  if(!uuidSchema.safeParse(publicationUUID).success||!['disponible','aceptada'].includes(expectedStatus)||!['disponible','aceptada'].includes(nextStatus)||expectedStatus===nextStatus)
   throw new CustomModelError('Publication','Cambio de disponibilidad inválido.');
  const publicationQuery='UPDATE Publication SET status = ?, updatedAt = UTC_TIMESTAMP(3) WHERE internalUUID = ? AND status = ? AND deletedAt IS NULL';
  const publicationParams=[nextStatus,publicationUUID,expectedStatus];const [updated]=await connection.execute(publicationQuery,publicationParams);
  if(/** @type {import('mysql2').ResultSetHeader} */(updated).affectedRows!==1)
   throw new CustomModelError('Publication','La publicación ya no está disponible. Actualiza el listado.','RESERVATION_CONFLICT',409);
 }catch(error){await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Publication reservation state update failed',source,'changeReservationStatus',null);throw error;}
};
/** FIND OWN PUBLICATION
 * @param {string} publicationUUID @param {string} ownerId
 * @param {import('mysql2/promise').PoolConnection|null} [connection]
 * @returns {Promise<PublicationRecord|null>}
 */
Publication.findByUUID = async (publicationUUID,ownerId,connection=null) => {
  try {
    if (!uuidSchema.safeParse(publicationUUID).success || !ownerIdSchema.safeParse(ownerId).success)
      throw new CustomModelError('Publication','Identificadores inválidos.');
    const publicationQuery = `SELECT P.internalUUID AS publicationUUID,
      P.materialType AS publicationMaterialType, CAST(P.quantityKg AS CHAR) AS publicationQuantityKg,
      P.locationText AS publicationLocationText, P.availabilityText AS publicationAvailabilityText,
      P.status AS publicationStatus,
      CONCAT('data:image/jpeg;base64,', REPLACE(TO_BASE64(P.photoJpeg), CHAR(10), '')) AS publicationPhotoDataUrl
      FROM Publication P WHERE P.internalUUID = ? AND P.ownerId = ? AND P.deletedAt IS NULL LIMIT 1`;
    const publicationParams = [publicationUUID,ownerId];
    const [publications] = await (connection || pool).execute(publicationQuery,publicationParams);
    return /** @type {Array<import('mysql2').RowDataPacket & PublicationRecord>} */ (publications)[0] || null;
  } catch (error) {
    await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Publication lookup failed',source,'findByUUID',null);
    throw error;
  }
};
/** FIND OWN PUBLICATIONS PAGE
 * @param {string} ownerId @param {number} page @param {number} limit
 * @param {import('mysql2/promise').PoolConnection} connection @returns {Promise<PublicationRecord[]>}
 */
Publication.findByOwner=async(ownerId,page,limit,connection)=>{
 try{if(!ownerIdSchema.safeParse(ownerId).success||!Number.isSafeInteger(page)||page<1||page>100000||!Number.isSafeInteger(limit)||limit<1||limit>12)throw new CustomModelError('Publication','Paginación inválida.');
 const publicationQuery=`SELECT P.internalUUID AS publicationUUID, P.materialType AS publicationMaterialType,
 CAST(P.quantityKg AS CHAR) AS publicationQuantityKg, P.locationText AS publicationLocationText,
 P.availabilityText AS publicationAvailabilityText, P.status AS publicationStatus,
 CONCAT('data:image/jpeg;base64,',REPLACE(TO_BASE64(P.photoJpeg),CHAR(10),'')) AS publicationPhotoDataUrl
 FROM Publication P WHERE P.ownerId = ? AND P.deletedAt IS NULL ORDER BY P.createdAt DESC, P.id DESC LIMIT ? OFFSET ?`;
 const publicationParams=[ownerId,String(limit),String((page-1)*limit)];const [publications]=await connection.execute(publicationQuery,publicationParams);
 return /** @type {Array<import('mysql2').RowDataPacket & PublicationRecord>} */(publications);
 }catch(error){await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Publication list failed',source,'findByOwner',null);throw error;}
};
// CREATE
/** CREATE AVAILABLE PUBLICATION
 * Caller must authorize and lock the owner in the same transaction.
 * @param {PublicationFields & {ownerId:string,photoJpeg:Buffer}} data
 * @param {import('mysql2/promise').PoolConnection} connection
 * @returns {Promise<PublicationRecord>}
 */
Publication.create = async (data,connection) => {
  try {
    const parsed = publicationFieldsSchema.extend({ownerId:ownerIdSchema,photoJpeg:photoSchema}).strict().safeParse(data);
    if (!parsed.success) throw new CustomModelError('Publication','Datos de publicación inválidos.');
    const publication = parsed.data;
    const publicationUUID = randomUUID();
    const publicationQuery = `INSERT INTO Publication
      (internalUUID, ownerId, materialType, quantityKg, locationText, availabilityText, photoJpeg, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const publicationParams = [publicationUUID,publication.ownerId,publication.materialType,publication.quantityKg,
      publication.locationText,publication.availabilityText,publication.photoJpeg,'disponible'];
    await connection.execute(publicationQuery,publicationParams);
    const created = await Publication.findByUUID(publicationUUID,publication.ownerId,connection);
    if (!created) throw new Error('Publication readback failed');
    return created;
  } catch (error) {
    await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Publication creation failed',source,'create',null);
    throw error;
  }
};
// UPDATE: preparatory model operation for US5; no HTTP edit endpoint in this delivery.
/** UPDATE OWN AVAILABLE PUBLICATION
 * @param {string} publicationUUID @param {string} ownerId
 * @param {Partial<PublicationFields> & {photoJpeg?:Buffer}} data
 * @param {import('mysql2/promise').PoolConnection} connection
 * @returns {Promise<void>}
 */
Publication.updateByUUID = async (publicationUUID,ownerId,data,connection) => {
  try {
    const parsed = publicationFieldsSchema.partial().extend({photoJpeg:photoSchema.optional()}).strict().safeParse(data);
    if (!uuidSchema.safeParse(publicationUUID).success || !ownerIdSchema.safeParse(ownerId).success || !parsed.success || !Object.keys(parsed.data).length)
      throw new CustomModelError('Publication','Cambios inválidos.');
    const allowedFields = /** @type {const} */ ({materialType:'materialType',quantityKg:'quantityKg',locationText:'locationText',availabilityText:'availabilityText',photoJpeg:'photoJpeg'});
    const entries = Object.entries(parsed.data);
    const assignments = entries.map(([field])=>`${allowedFields[/** @type {keyof typeof allowedFields} */ (field)]} = ?`);
    const publicationQuery = `UPDATE Publication SET ${assignments.join(', ')}, updatedAt = CURRENT_TIMESTAMP(3)
      WHERE internalUUID = ? AND ownerId = ? AND status = ? AND deletedAt IS NULL`;
    const publicationParams = [...entries.map(([,value])=>value),publicationUUID,ownerId,'disponible'];
    const [updated] = await connection.execute(publicationQuery,publicationParams);
    if (/** @type {import('mysql2').ResultSetHeader} */ (updated).affectedRows !== 1)
      throw new CustomModelError('Publication','La publicación no está disponible para editar.','PUBLICATION_NOT_EDITABLE',409);
  } catch (error) {
    await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Publication update failed',source,'updateByUUID',null);
    throw error;
  }
};
// DELETE LOGICAL: supported by deletedAt, restricted atomically to owner and available status.
/** SOFT DELETE OWN AVAILABLE PUBLICATION
 * @param {string} publicationUUID @param {string} ownerId
 * @param {import('mysql2/promise').PoolConnection} connection @returns {Promise<void>}
 */
Publication.softDeleteByUUID = async (publicationUUID,ownerId,connection) => {
  try {
    if (!uuidSchema.safeParse(publicationUUID).success || !ownerIdSchema.safeParse(ownerId).success)
      throw new CustomModelError('Publication','Identificadores inválidos.');
    const publicationQuery = `UPDATE Publication SET deletedAt = CURRENT_TIMESTAMP(3)
      WHERE internalUUID = ? AND ownerId = ? AND status = ? AND deletedAt IS NULL`;
    const publicationParams = [publicationUUID,ownerId,'disponible'];
    const [deleted] = await connection.execute(publicationQuery,publicationParams);
    if (/** @type {import('mysql2').ResultSetHeader} */ (deleted).affectedRows !== 1)
      throw new CustomModelError('Publication','La publicación no está disponible para eliminar.','PUBLICATION_NOT_EDITABLE',409);
  } catch (error) {
    await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Publication deletion failed',source,'softDeleteByUUID',null);
    throw error;
  }
};
// DELETE PHYSICAL / DOMAIN: not exposed; no business requirement in this scope.
module.exports = Publication;
