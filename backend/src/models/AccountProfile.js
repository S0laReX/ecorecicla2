const {modelGuard}=require('../utils/modelGuard');
const {ownerIdSchema}=require('../schemas/publicationSchema');
const {profileInputSchema,historyQuerySchema}=require('../schemas/profileSchema');
const CustomModelError=require('../utils/customModelError');
/** @typedef {import('mysql2/promise').PoolConnection} Connection */
/** @param {string} id */
function validate(id){if(!ownerIdSchema.safeParse(id).success)throw new CustomModelError('AccountProfile','Identidad inválida.');}
/** @param {string} id @param {Connection} connection */
exports.read=(id,connection)=>modelGuard('AccountProfile','read',async()=>{
 validate(id);const [rows]=await connection.execute(`SELECT U.internalUUID AS userUUID,U.displayName,U.email,U.roleCode,U.verificationStatus,
 COALESCE(A.contact,C.contactName,'') AS contact,COALESCE(A.address,C.coverageArea,'') AS address
 FROM User U LEFT JOIN AccountProfile A ON A.userId=U.id LEFT JOIN CompanyProfile C ON C.userId=U.id WHERE U.id=? AND U.deletedAt IS NULL`,[id]);
 return /** @type {import('mysql2').RowDataPacket[]} */(rows)[0];
});
/** @param {string} id @param {import('zod').infer<typeof profileInputSchema>} input @param {Connection} connection */
exports.update=(id,input,connection)=>modelGuard('AccountProfile','update',async()=>{
 validate(id);if(!profileInputSchema.safeParse(input).success)throw new CustomModelError('AccountProfile','Perfil inválido.');
 await connection.execute('UPDATE User SET displayName=?,updatedAt=UTC_TIMESTAMP(3) WHERE id=?',[input.displayName,id]);
 await connection.execute(`INSERT INTO AccountProfile (userId,contact,address) VALUES (?,?,?) ON DUPLICATE KEY UPDATE contact=?,address=?,updatedAt=UTC_TIMESTAMP(3)`,[id,input.contact,input.address,input.contact,input.address]);
});
/** @param {string} id @param {Connection} connection */
exports.summary=(id,connection)=>modelGuard('AccountProfile','summary',async()=>{
 validate(id);const [rows]=await connection.execute(`SELECT
 (SELECT COUNT(*) FROM Publication WHERE ownerId=? AND deletedAt IS NULL AND status IN ('disponible','aceptada')) AS activePublications,
 (SELECT COUNT(*) FROM CollectionReservation C JOIN Publication P ON P.id=C.publicationId WHERE C.status='CONFIRMADA' AND (C.companyUserId=? OR P.ownerId=?)) AS confirmedCollections,
 (SELECT COALESCE(SUM(points),0) FROM CollectionPointAward WHERE recipientUserId=?) AS totalPoints,
 (SELECT ROUND(AVG(score),2) FROM CollectionRating WHERE ratedUserId=?) AS averageRating,
 (SELECT COUNT(*) FROM CollectionRating WHERE ratedUserId=?) AS ratingCount`,[id,id,id,id,id,id]);
 const row=/** @type {import('mysql2').RowDataPacket[]} */(rows)[0];
 return {activePublications:Number(row.activePublications),confirmedCollections:Number(row.confirmedCollections),totalPoints:Number(row.totalPoints),averageRating:row.averageRating===null?null:Number(row.averageRating),ratingCount:Number(row.ratingCount)};
});
const effectiveStatus="CASE WHEN C.status='ACEPTADA' AND C.expiresAt<UTC_TIMESTAMP(3) THEN 'VENCIDA' ELSE C.status END";
/** @param {string} id @param {import('zod').infer<typeof historyQuerySchema>} query @param {Connection} connection */
exports.history=(id,query,connection)=>modelGuard('AccountProfile','history',async()=>{
 validate(id);if(!historyQuerySchema.safeParse(query).success)throw new CustomModelError('AccountProfile','Filtro inválido.');
 const where=`(C.companyUserId=? OR P.ownerId=?)${query.status==='ALL'?'':` AND (${effectiveStatus})=?`}`;
 const params=query.status==='ALL'?[id,id]:[id,id,query.status];
 const from='FROM CollectionReservation C JOIN Publication P ON P.id=C.publicationId';
 const [counts]=await connection.execute(`SELECT COUNT(*) AS total ${from} WHERE ${where}`,params);
 const [rows]=await connection.execute(`SELECT C.internalUUID AS reservationUUID,P.materialType,CAST(P.quantityKg AS CHAR) AS quantityKg,
 C.scheduledAt AS date,${effectiveStatus} AS status,
 COALESCE((SELECT SUM(A.points) FROM CollectionPointAward A WHERE A.reservationId=C.id AND A.recipientUserId=?),0) AS points
 ${from} WHERE ${where} ORDER BY C.scheduledAt DESC,C.id DESC LIMIT ? OFFSET ?`,[id,...params,String(query.limit),String((query.page-1)*query.limit)]);
 return {items:/** @type {import('mysql2').RowDataPacket[]} */(rows).map(row=>({...row,points:Number(row.points),date:new Date(row.date).toISOString()})),meta:{total:Number(/** @type {import('mysql2').RowDataPacket[]} */(counts)[0].total),page:query.page,limit:query.limit}};
});
