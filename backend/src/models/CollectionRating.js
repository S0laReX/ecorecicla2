const {randomUUID}=require('node:crypto');
const {pool}=require('../config/database');
const {ownerIdSchema}=require('../schemas/publicationSchema');
const {ratingUUIDSchema}=require('../schemas/ratingSchema');
const CustomModelError=require('../utils/customModelError');
const {modelGuard}=require('../utils/modelGuard');
const model={};

/** FETCH CONFIRMED, UNRATED COLLECTIONS FOR ONE PARTICIPANT @param {string} userId @returns {Promise<Array<object>>} */
/** @param {string} userId @param {import('mysql2/promise').Pool|import('mysql2/promise').PoolConnection} [connection] */
model.findPendingByUser=async(userId,connection=pool)=>modelGuard('CollectionRating','findPendingByUser',async()=>{
 if(!ownerIdSchema.safeParse(userId).success)throw new CustomModelError('CollectionRating','Identidad inválida.');
 const query=`SELECT C.internalUUID AS reservationUUID,C.confirmedAt AS confirmedAt,P.materialType AS materialType,
  CAST(P.quantityKg AS CHAR) AS quantityKg,Other.internalUUID AS ratedUserUUID,Other.displayName AS ratedDisplayName,
  ROUND((SELECT AVG(R.score) FROM CollectionRating R WHERE R.ratedUserId=Other.id),2) AS ratedAverage,
  (SELECT COUNT(R.id) FROM CollectionRating R WHERE R.ratedUserId=Other.id) AS ratedCount
  FROM CollectionReservation C JOIN Publication P ON P.id=C.publicationId
  JOIN User Other ON Other.id=CASE WHEN C.companyUserId=? THEN P.ownerId ELSE C.companyUserId END
  WHERE C.status='CONFIRMADA' AND C.confirmedAt IS NOT NULL AND (C.companyUserId=? OR P.ownerId=?)
  AND NOT EXISTS(SELECT 1 FROM CollectionRating Mine WHERE Mine.reservationId=C.id AND Mine.raterUserId=?)
  ORDER BY C.confirmedAt DESC,C.id DESC LIMIT 100`;
 const [rows]=await connection.execute(query,[userId,userId,userId,userId]);
 return /** @type {import('mysql2').RowDataPacket[]} */(rows).map(row=>({...row,ratedAverage:row.ratedAverage===null?null:Number(row.ratedAverage),ratedCount:Number(row.ratedCount)}));
});

/** FIND A CONFIRMED COLLECTION IN WHICH THE USER PARTICIPATED @param {string} reservationUUID @param {string} userId @param {import('mysql2/promise').PoolConnection} connection */
model.findParticipation=(reservationUUID,userId,connection)=>modelGuard('CollectionRating','findParticipation',async()=>{
 if(!ratingUUIDSchema.safeParse(reservationUUID).success||!ownerIdSchema.safeParse(userId).success)throw new CustomModelError('CollectionRating','Identificadores inválidos.');
 const query=`SELECT CAST(C.id AS CHAR) AS reservationId,CAST(C.companyUserId AS CHAR) AS companyUserId,
  CAST(P.ownerId AS CHAR) AS publisherUserId,C.status AS reservationStatus,
  Company.internalUUID AS companyUUID,Publisher.internalUUID AS publisherUUID
  FROM CollectionReservation C JOIN Publication P ON P.id=C.publicationId
  JOIN User Company ON Company.id=C.companyUserId JOIN User Publisher ON Publisher.id=P.ownerId
  WHERE C.internalUUID=? AND (C.companyUserId=? OR P.ownerId=?) LIMIT 1`;
 const [rows]=await connection.execute(query,[reservationUUID,userId,userId]);
 return /** @type {import('mysql2').RowDataPacket[]} */(rows)[0]||null;
});

/** INSERT A STAR RATING WITHIN THE CALLER'S TRANSACTION @param {{reservationId:string,raterUserId:string,ratedUserId:string,score:number}} data @param {import('mysql2/promise').PoolConnection} connection */
model.create=(data,connection)=>modelGuard('CollectionRating','create',async()=>{
 if(!ownerIdSchema.safeParse(data.reservationId).success||!ownerIdSchema.safeParse(data.raterUserId).success||!ownerIdSchema.safeParse(data.ratedUserId).success||data.raterUserId===data.ratedUserId||!Number.isInteger(data.score)||data.score<1||data.score>5)throw new CustomModelError('CollectionRating','Calificación inválida.');
 const [result]=await connection.execute('INSERT INTO CollectionRating (internalUUID,reservationId,raterUserId,ratedUserId,score,createdAt) VALUES (?,?,?,?,?,UTC_TIMESTAMP(3))',[randomUUID(),data.reservationId,data.raterUserId,data.ratedUserId,data.score]);
 return /** @type {import('mysql2').ResultSetHeader} */(result).insertId.toString();
});

/** READ THE AVERAGE PROFILE SCORE @param {string} userId @returns {Promise<{average:number|null,count:number}>} */
/** @param {string} userId @param {import('mysql2/promise').Pool|import('mysql2/promise').PoolConnection} [connection] */
model.readAverageByUser=async(userId,connection=pool)=>modelGuard('CollectionRating','readAverageByUser',async()=>{
 if(!ownerIdSchema.safeParse(userId).success)throw new CustomModelError('CollectionRating','Identidad inválida.');
 const [rows]=await connection.execute('SELECT ROUND(AVG(score),2) AS average,COUNT(id) AS ratingCount FROM CollectionRating WHERE ratedUserId=?',[userId]);
 const row=/** @type {import('mysql2').RowDataPacket[]} */(rows)[0];
 return {average:row.average===null?null:Number(row.average),count:Number(row.ratingCount)};
});
module.exports=model;
