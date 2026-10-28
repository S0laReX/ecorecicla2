const {randomUUID}=require('node:crypto');
const {modelGuard}=require('../utils/modelGuard');
const {z}=require('zod');
const {ownerIdSchema,uuidSchema}=require('../schemas/publicationSchema');
const CustomModelError=require('../utils/customModelError');
const noticeInput=z.object({recipientUserId:ownerIdSchema,kind:z.enum(['ACCEPTED','CONFIRMED','RATE','APPROVED','REJECTED']),eventUUID:uuidSchema,title:z.string().min(1).max(120),body:z.string().min(1).max(1000)}).strict();
/** @param {string} userId */
function validateRecipient(userId){if(!ownerIdSchema.safeParse(userId).success)throw new CustomModelError('Notice','Identidad inválida.');}
/** @typedef {import('mysql2/promise').PoolConnection} Connection */
/** @typedef {'ACCEPTED'|'CONFIRMED'|'RATE'|'APPROVED'|'REJECTED'} Kind */
/** Persist within the business transaction. Repeated events preserve the original read state.
 * @param {{recipientUserId:string,kind:Kind,eventUUID:string,title:string,body:string}} data @param {Connection} connection */
exports.create=(data,connection)=>modelGuard('Notice','create',async()=>{
 if(!noticeInput.safeParse(data).success)throw new CustomModelError('Notice','Aviso inválido.');
 await connection.execute('INSERT INTO Notice (internalUUID,recipientUserId,kind,eventUUID,title,body) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id',[randomUUID(),data.recipientUserId,data.kind,data.eventUUID,data.title,data.body]);
});
/** @param {string} userId @param {Connection} connection */
exports.unreadCount=async(userId,connection)=>{
 validateRecipient(userId);
 const [rows]=await connection.execute('SELECT COUNT(*) AS total FROM Notice WHERE recipientUserId=? AND readAt IS NULL',[userId]);
 return Number(/** @type {import('mysql2').RowDataPacket[]} */(rows)[0].total);
};
/** @param {string} userId @param {{status:'ALL'|'READ'|'UNREAD',page:number,limit:number}} query @param {Connection} connection */
exports.list=async(userId,query,connection)=>{
 validateRecipient(userId);
 if(!['ALL','READ','UNREAD'].includes(query.status)||!Number.isSafeInteger(query.page)||query.page<1||query.page>100000||!Number.isSafeInteger(query.limit)||query.limit<1||query.limit>50)throw new CustomModelError('Notice','Filtros inválidos.');
 const filter=query.status==='ALL'?'':query.status==='READ'?' AND readAt IS NOT NULL':' AND readAt IS NULL';
 const [counts]=await connection.execute(`SELECT COUNT(*) AS total FROM Notice WHERE recipientUserId=?${filter}`,[userId]);
 const [rows]=await connection.execute(`SELECT internalUUID AS noticeUUID,kind,title,body,createdAt,readAt FROM Notice WHERE recipientUserId=?${filter} ORDER BY createdAt DESC,id DESC LIMIT ? OFFSET ?`,[userId,String(query.limit),String((query.page-1)*query.limit)]);
 return {items:/** @type {import('mysql2').RowDataPacket[]} */(rows),meta:{total:Number(/** @type {import('mysql2').RowDataPacket[]} */(counts)[0].total),page:query.page,limit:query.limit}};
};
/** @param {string} userId @param {string} uuid @param {Connection} connection */
exports.markRead=async(userId,uuid,connection)=>{
 validateRecipient(userId);
 if(!uuidSchema.safeParse(uuid).success)throw new CustomModelError('Notice','Identificador inválido.');
 await connection.execute('UPDATE Notice SET readAt=COALESCE(readAt,UTC_TIMESTAMP(3)) WHERE internalUUID=? AND recipientUserId=?',[uuid,userId]);
 const [rows]=await connection.execute('SELECT internalUUID AS noticeUUID,readAt FROM Notice WHERE internalUUID=? AND recipientUserId=?',[uuid,userId]);
 return /** @type {import('mysql2').RowDataPacket[]} */(rows)[0]||null;
};
