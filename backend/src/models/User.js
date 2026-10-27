const {z}=require('zod');
const {pool}=require('../config/database');
const {uuidSchema,ownerIdSchema}=require('../schemas/publicationSchema');
const CustomModelError=require('../utils/customModelError');
const {modelGuard}=require('../utils/modelGuard');
/** @typedef {{userId:string,userUUID:string,userRoleCode:'USER'|'COMPANY'|'ADMIN',userAccountStatus:string,userVerificationStatus:string,userTokenVersion:number,userDisplayName:string,userEmail:string,userPasswordHash:string}} UserContext */
/** @typedef {import('mysql2/promise').PoolConnection} Connection */
const selection=`CAST(U.id AS CHAR) AS userId, U.internalUUID AS userUUID, U.roleCode AS userRoleCode,
 U.accountStatus AS userAccountStatus, U.verificationStatus AS userVerificationStatus, U.tokenVersion AS userTokenVersion,
 U.displayName AS userDisplayName, U.email AS userEmail, U.passwordHash AS userPasswordHash`;
const createSchema=z.object({userUUID:uuidSchema,displayName:z.string().min(2).max(120),email:z.string().email().max(254),
 passwordHash:z.string().regex(/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/),roleCode:z.enum(['USER','COMPANY','ADMIN']),
 verificationDocumentKey:uuidSchema.nullable()}).strict();
const accountStatusSchema=z.enum(['ACTIVE','SUSPENDED']);
const adminStatusFilterSchema=z.enum(['ALL','ACTIVE','PENDING','APPROVED','REJECTED','SUSPENDED']);
const adminAccountSelect=`U.internalUUID AS userUUID,U.displayName AS displayName,U.email AS email,U.roleCode AS roleCode,
 U.accountStatus AS accountStatus,U.verificationStatus AS verificationStatus,
 CASE WHEN U.accountStatus='SUSPENDED' THEN 'SUSPENDED' WHEN U.roleCode='COMPANY' THEN U.verificationStatus ELSE 'ACTIVE' END AS status,
 U.createdAt AS createdAt,U.updatedAt AS updatedAt`;
/** @param {string} search @param {string} status */
function adminAccountWhere(search,status){
 const clauses=["U.deletedAt IS NULL","U.roleCode IN ('USER','COMPANY')"];const params=[];
 if(search){clauses.push('(U.displayName LIKE ? OR U.email LIKE ?)');params.push(`%${search}%`,`%${search}%`);}
 if(status==='ACTIVE')clauses.push("U.roleCode='USER' AND U.accountStatus='ACTIVE'");
 else if(status==='SUSPENDED')clauses.push("U.accountStatus='SUSPENDED'");
 else if(['PENDING','APPROVED','REJECTED'].includes(status)){clauses.push("U.roleCode='COMPANY' AND U.accountStatus='ACTIVE' AND U.verificationStatus=?");params.push(status);}
 return {where:clauses.join(' AND '),params};
}
/** @typedef {import('zod').infer<typeof createSchema>} CreateUser */
// FIND
/** FIND USER BY EMAIL @param {string} email @param {Connection|null} [connection] @returns {Promise<UserContext|null>} */
exports.findByEmail=(email,connection=null)=>modelGuard('User','findByEmail',async()=>{
 if(!z.string().email().max(254).safeParse(email).success)throw new CustomModelError('User','Correo inválido.');
 const userQuery=`SELECT ${selection} FROM User U WHERE U.email = ? AND U.deletedAt IS NULL LIMIT 1`;
 const userParams=[email];const [users]=await(connection||pool).execute(userQuery,userParams);
 return /** @type {Array<import('mysql2').RowDataPacket & UserContext>} */(users)[0]||null;
});
/** FIND AND LOCK CURRENT USER CONTEXT @param {string} userUUID @param {Connection} connection @returns {Promise<UserContext|null>} */
exports.findContextForUpdate=(userUUID,connection)=>modelGuard('User','findContextForUpdate',async()=>{
 if(!uuidSchema.safeParse(userUUID).success)throw new CustomModelError('User','Identidad inválida.');
 const userQuery=`SELECT ${selection} FROM User U WHERE U.internalUUID = ? AND U.deletedAt IS NULL LIMIT 1 FOR UPDATE`;
 const userParams=[userUUID];const [users]=await connection.execute(userQuery,userParams);
 return /** @type {Array<import('mysql2').RowDataPacket & UserContext>} */(users)[0]||null;
});
/** FIND CURRENT USER BY UUID @param {string} userUUID @param {Connection|null} [connection] @returns {Promise<UserContext|null>} */
exports.findByUUID=(userUUID,connection=null)=>modelGuard('User','findByUUID',async()=>{
 if(!uuidSchema.safeParse(userUUID).success)throw new CustomModelError('User','Identidad inválida.');
 const userQuery=`SELECT ${selection} FROM User U WHERE U.internalUUID = ? AND U.deletedAt IS NULL LIMIT 1`;
 const userParams=[userUUID];const [users]=await(connection||pool).execute(userQuery,userParams);
 return /** @type {Array<import('mysql2').RowDataPacket & UserContext>} */(users)[0]||null;
});
// CREATE
/** CREATE ACCOUNT @param {CreateUser} data @param {Connection} connection @returns {Promise<UserContext>} */
exports.create=(data,connection)=>modelGuard('User','create',async()=>{
 const parsed=createSchema.safeParse(data);
 if(!parsed.success||(data.roleCode==='COMPANY')!==(data.verificationDocumentKey!==null))throw new CustomModelError('User','Datos de registro inválidos.');
 const userQuery=`INSERT INTO User (internalUUID,displayName,email,passwordHash,roleCode,accountStatus,verificationStatus,verificationDocumentKey)
 VALUES (?,?,?,?,?,?,?,?)`;
 const userParams=[data.userUUID,data.displayName,data.email,data.passwordHash,data.roleCode,'ACTIVE',data.roleCode==='COMPANY'?'PENDING':'NOT_REQUIRED',data.verificationDocumentKey];
 await connection.execute(userQuery,userParams);const user=await exports.findByUUID(data.userUUID,connection);
 if(!user)throw new Error('Account creation failed');return user;
});
// UPDATE — explicit whitelist: passwordHash only; tokenVersion is always incremented by the server.
/** REPLACE PASSWORD AND REVOKE ACCESS TOKENS @param {string} userId @param {{passwordHash:string}} data @param {Connection} connection @returns {Promise<void>} */
exports.updatePassword=(userId,data,connection)=>modelGuard('User','updatePassword',async()=>{
 const allowed=z.object({passwordHash:createSchema.shape.passwordHash}).strict().safeParse(data);
 if(!ownerIdSchema.safeParse(userId).success||!allowed.success)throw new CustomModelError('User','Cambio de contraseña inválido.');
 const userQuery='UPDATE User SET passwordHash = ?, tokenVersion = tokenVersion + 1 WHERE id = ? AND deletedAt IS NULL';
 const userParams=[allowed.data.passwordHash,userId];await connection.execute(userQuery,userParams);
});
/** UPDATE COMPANY VERIFICATION STATUS @param {string} userId @param {'APPROVED'|'REJECTED'} verificationStatus @param {Connection} connection @returns {Promise<void>} */
exports.updateCompanyVerificationStatus=(userId,verificationStatus,connection)=>modelGuard('User','updateCompanyVerificationStatus',async()=>{
 if(!ownerIdSchema.safeParse(userId).success||!['APPROVED','REJECTED'].includes(verificationStatus))throw new CustomModelError('User','Decisión de verificación inválida.');
 const userQuery='UPDATE User SET verificationStatus = ?, updatedAt = UTC_TIMESTAMP(3) WHERE id = ? AND roleCode = ? AND verificationStatus = ? AND deletedAt IS NULL';
 const userParams=[verificationStatus,userId,'COMPANY','PENDING'];const [updated]=await connection.execute(userQuery,userParams);
 if(/** @type {import('mysql2').ResultSetHeader} */(updated).affectedRows!==1)throw new CustomModelError('User','La solicitud ya fue atendida. Actualiza el listado.','COMPANY_DECISION_CONFLICT',409);
});
/** LIST ADMIN-MANAGEABLE ACCOUNTS @param {number} page @param {number} limit @param {string} search @param {string} status @param {Connection} connection */
exports.findAdminAccounts=async(page,limit,search,status,connection)=>modelGuard('User','findAdminAccounts',async()=>{
 const filter=adminStatusFilterSchema.safeParse(status);if(!Number.isSafeInteger(page)||page<1||!Number.isSafeInteger(limit)||limit<1||limit>50||!filter.success||typeof search!=='string'||search.length>120)throw new CustomModelError('User','Filtros de cuentas inválidos.');
 const {where,params}=adminAccountWhere(search,filter.data);
 const [rows]=await connection.execute(`SELECT ${adminAccountSelect} FROM User U WHERE ${where} ORDER BY U.updatedAt DESC,U.id DESC LIMIT ? OFFSET ?`,[...params,String(limit),String((page-1)*limit)]);
 return /** @type {import('mysql2').RowDataPacket[]} */(rows);
});
/** COUNT ADMIN-MANAGEABLE ACCOUNTS @param {string} search @param {string} status @param {Connection} connection */
exports.readAdminAccountCount=async(search,status,connection)=>modelGuard('User','readAdminAccountCount',async()=>{
 const filter=adminStatusFilterSchema.safeParse(status);if(!filter.success||typeof search!=='string'||search.length>120)throw new CustomModelError('User','Filtros de cuentas inválidos.');
 const {where,params}=adminAccountWhere(search,filter.data);
 const [rows]=await connection.execute(`SELECT COUNT(U.id) AS total FROM User U WHERE ${where}`,params);
 return Number(/** @type {import('mysql2').RowDataPacket[]} */(rows)[0].total);
});
/** FIND A MANAGEABLE ACCOUNT AND LOCK IT @param {string} userUUID @param {Connection} connection */
exports.findManageableAccountByUUIDForUpdate=async(userUUID,connection)=>modelGuard('User','findManageableAccountByUUIDForUpdate',async()=>{
 if(!uuidSchema.safeParse(userUUID).success)throw new CustomModelError('User','Cuenta no encontrada.','ACCOUNT_NOT_FOUND',404);
 const [rows]=await connection.execute(`SELECT CAST(U.id AS CHAR) AS userId,${adminAccountSelect} FROM User U WHERE U.internalUUID=? AND U.roleCode IN ('USER','COMPANY') AND U.deletedAt IS NULL LIMIT 1 FOR UPDATE`,[userUUID]);
 return /** @type {import('mysql2').RowDataPacket[]} */(rows)[0]||null;
});
/** CHANGE ACCOUNT ACCESS STATE @param {string} userId @param {string} previousStatus @param {string} nextStatus @param {Connection} connection */
exports.updateAccountStatus=async(userId,previousStatus,nextStatus,connection)=>modelGuard('User','updateAccountStatus',async()=>{
 if(!ownerIdSchema.safeParse(userId).success||!accountStatusSchema.safeParse(previousStatus).success||!accountStatusSchema.safeParse(nextStatus).success||previousStatus===nextStatus)throw new CustomModelError('User','Cambio de estado inválido.');
 const [result]=await connection.execute("UPDATE User SET accountStatus=?,tokenVersion=tokenVersion+1,updatedAt=UTC_TIMESTAMP(3) WHERE id=? AND accountStatus=? AND roleCode IN ('USER','COMPANY') AND deletedAt IS NULL",[nextStatus,userId,previousStatus]);
 if(/** @type {import('mysql2').ResultSetHeader} */(result).affectedRows!==1)throw new CustomModelError('User','El estado de la cuenta cambió. Actualiza el listado.','ACCOUNT_STATUS_CONFLICT',409);
});
