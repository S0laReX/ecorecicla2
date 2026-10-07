const {z}=require('zod');
const {ownerIdSchema}=require('../schemas/publicationSchema');
const CustomModelError=require('../utils/customModelError');
const {modelGuard}=require('../utils/modelGuard');
const schema=z.object({userId:ownerIdSchema,taxIdentifier:z.string().regex(/^[A-Za-z0-9-]{4,40}$/),contactName:z.string().min(2).max(120),coverageArea:z.string().min(3).max(300),documentContent:z.instanceof(Buffer).refine(b=>b.length>3&&b.length<=5242880),documentMime:z.enum(['application/pdf','image/jpeg'])}).strict();
/** COUNT PENDING COMPANY PROFILES @param {string} [search] @param {import('mysql2/promise').PoolConnection} connection @returns {Promise<number>} */
exports.readPendingCount=async(search='',connection)=>modelGuard('CompanyProfile','readPendingCount',async()=>{
 const companyProfileQuery=`SELECT COUNT(CP.id) AS companyProfileCount FROM CompanyProfile CP
 JOIN User U ON U.id = CP.userId WHERE U.roleCode = ? AND U.verificationStatus = ? AND U.deletedAt IS NULL
 AND (? = '' OR U.displayName LIKE ? OR CP.taxIdentifier LIKE ?)`;
 const searchPattern=`%${search}%`;const companyProfileParams=['COMPANY','PENDING',search,searchPattern,searchPattern];
 const [profiles]=await connection.execute(companyProfileQuery,companyProfileParams);
 return Number(/** @type {import('mysql2').RowDataPacket[]} */(profiles)[0].companyProfileCount);
});
/** FIND PENDING COMPANY PROFILES @param {string} search @param {number} page @param {number} limit @param {import('mysql2/promise').PoolConnection} connection */
exports.findPending=async(search,page,limit,connection)=>modelGuard('CompanyProfile','findPending',async()=>{
 if(!Number.isSafeInteger(page)||page<1||page>100000||!Number.isSafeInteger(limit)||limit<1||limit>50)throw new CustomModelError('CompanyProfile','Paginación inválida.');
 const companyProfileQuery=`SELECT U.internalUUID AS companyUUID, U.displayName AS companyName,
 U.email AS companyEmail, CP.taxIdentifier AS companyTaxIdentifier, CP.contactName AS companyContactName,
 CP.coverageArea AS companyCoverageArea, U.verificationStatus AS companyVerificationStatus,
 U.createdAt AS companyCreatedAt
 FROM CompanyProfile CP JOIN User U ON U.id = CP.userId
 WHERE U.roleCode = ? AND U.verificationStatus = ? AND U.deletedAt IS NULL
 AND (? = '' OR U.displayName LIKE ? OR CP.taxIdentifier LIKE ?)
 ORDER BY U.createdAt ASC, U.id ASC LIMIT ? OFFSET ?`;
 const searchPattern=`%${search}%`;const companyProfileParams=['COMPANY','PENDING',search,searchPattern,searchPattern,String(limit),String((page-1)*limit)];
 const [profiles]=await connection.execute(companyProfileQuery,companyProfileParams);
 return /** @type {import('mysql2').RowDataPacket[]} */(profiles);
});
/** FIND AND LOCK PENDING COMPANY PROFILE @param {string} companyUUID @param {import('mysql2/promise').PoolConnection} connection */
exports.findPendingByUUIDForUpdate=async(companyUUID,connection)=>modelGuard('CompanyProfile','findPendingByUUIDForUpdate',async()=>{
 const companyProfileQuery=`SELECT CAST(U.id AS CHAR) AS companyUserId FROM CompanyProfile CP
 JOIN User U ON U.id = CP.userId WHERE U.internalUUID = ? AND U.roleCode = ?
 AND U.verificationStatus = ? AND U.deletedAt IS NULL LIMIT 1 FOR UPDATE`;
 const companyProfileParams=[companyUUID,'COMPANY','PENDING'];const [profiles]=await connection.execute(companyProfileQuery,companyProfileParams);
 return /** @type {import('mysql2').RowDataPacket[]} */(profiles)[0]||null;
});
/** FIND PRIVATE PENDING VERIFICATION DOCUMENT @param {string} companyUUID @param {import('mysql2/promise').PoolConnection} connection */
exports.findPendingDocumentByUUID=async(companyUUID,connection)=>modelGuard('CompanyProfile','findPendingDocumentByUUID',async()=>{
 const companyProfileQuery=`SELECT CP.documentContent AS companyDocumentContent, CP.documentMime AS companyDocumentMime
 FROM CompanyProfile CP JOIN User U ON U.id = CP.userId WHERE U.internalUUID = ? AND U.roleCode = ?
 AND U.verificationStatus = ? AND U.deletedAt IS NULL LIMIT 1`;
 const companyProfileParams=[companyUUID,'COMPANY','PENDING'];const [profiles]=await connection.execute(companyProfileQuery,companyProfileParams);
 return /** @type {import('mysql2').RowDataPacket[]} */(profiles)[0]||null;
});
// CREATE
/** CREATE COMPANY PROFILE @param {import('zod').infer<typeof schema>} data @param {import('mysql2/promise').PoolConnection} connection @returns {Promise<void>} */
exports.create=(data,connection)=>modelGuard('CompanyProfile','create',async()=>{
 const parsed=schema.safeParse(data);if(!parsed.success)throw new CustomModelError('CompanyProfile','Datos empresariales inválidos.');
 const companyProfileQuery='INSERT INTO CompanyProfile (userId,taxIdentifier,contactName,coverageArea,documentContent,documentMime) VALUES (?,?,?,?,?,?)';
 const companyProfileParams=[data.userId,data.taxIdentifier,data.contactName,data.coverageArea,data.documentContent,data.documentMime];
 await connection.execute(companyProfileQuery,companyProfileParams);
});
