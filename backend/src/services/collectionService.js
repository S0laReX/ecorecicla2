const {releaseExpiredReservations}=require('./collectionExpiryService');
const Publication=require('../models/Publication');
const {transaction}=require('./transactionService');
const {lockSessionUser}=require('./sessionPolicy');
const CustomModelError=require('../utils/customModelError');
/** Authorize against current database state, inside the same transaction as the read.
 * @param {import('./sessionPolicy').AuthContext} auth
 * @param {import('mysql2/promise').PoolConnection} connection
 */
async function requireCollector(auth,connection){
 const user=await lockSessionUser(auth,connection);
 if(user.userRoleCode!=='COMPANY')throw new CustomModelError('User','Solo las empresas pueden explorar recolecciones.','ROLE_FORBIDDEN',403);
 if(user.userVerificationStatus!=='APPROVED')throw new CustomModelError('User','Tu empresa necesita aprobación para explorar recolecciones.','COMPANY_PENDING',403);
 return user;
}
/** LIST AVAILABLE THIRD-PARTY PUBLICATIONS
 * @param {import('./sessionPolicy').AuthContext} auth
 * @param {import('zod').infer<typeof import('../schemas/collectionSchema').collectionQuerySchema>} query
 */
exports.listAvailablePublications=async(auth,query)=>{await releaseExpiredReservations();return transaction(async connection=>{
 const user=await requireCollector(auth,connection);
 const total=await Publication.readAvailableCount(user.userId,query,connection);
 const publications=await Publication.findAvailable(user.userId,query,connection);
 return {publications,meta:{total,page:query.page,limit:query.limit}};
});};
/** RETRIEVE AN AVAILABLE THIRD-PARTY PUBLICATION
 * @param {import('./sessionPolicy').AuthContext} auth @param {string} publicationUUID
 */
exports.retrieveAvailablePublication=async(auth,publicationUUID)=>{await releaseExpiredReservations();return transaction(async connection=>{
 const user=await requireCollector(auth,connection);
 const publication=await Publication.findAvailableByUUID(publicationUUID,user.userId,connection);
 if(!publication)throw new CustomModelError('Publication','Esta publicación ya no está disponible. Actualiza el listado.','PUBLICATION_NOT_FOUND',404);
 return publication;
});};
