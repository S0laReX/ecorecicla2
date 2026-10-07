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
