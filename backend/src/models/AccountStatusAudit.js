const {randomUUID}=require('node:crypto');
const {z}=require('zod');
const {ownerIdSchema}=require('../schemas/publicationSchema');
const {modelGuard}=require('../utils/modelGuard');
const CustomModelError=require('../utils/customModelError');
const auditSchema=z.object({targetUserId:ownerIdSchema,actorAdminId:ownerIdSchema,previousStatus:z.enum(['ACTIVE','SUSPENDED']),newStatus:z.enum(['ACTIVE','SUSPENDED'])}).strict().refine(value=>value.previousStatus!==value.newStatus);
/** RECORD ACCOUNT ACCESS CHANGE INSIDE THE ADMIN TRANSACTION
 * @param {z.infer<typeof auditSchema>} data
 * @param {import('mysql2/promise').PoolConnection} connection
 * @returns {Promise<Date>}
 */
exports.create=(data,connection)=>modelGuard('AccountStatusAudit','create',async()=>{
 const parsed=auditSchema.safeParse(data);if(!parsed.success)throw new CustomModelError('AccountStatusAudit','Auditoría de estado inválida.');
 const internalUUID=randomUUID();
 await connection.execute('INSERT INTO AccountStatusAudit (internalUUID,targetUserId,actorAdminId,previousStatus,newStatus,createdAt) VALUES (?,?,?,?,?,UTC_TIMESTAMP(3))',[internalUUID,parsed.data.targetUserId,parsed.data.actorAdminId,parsed.data.previousStatus,parsed.data.newStatus]);
 const [rows]=await connection.execute('SELECT createdAt FROM AccountStatusAudit WHERE internalUUID=? LIMIT 1',[internalUUID]);
 const row=/** @type {import('mysql2').RowDataPacket[]} */(rows)[0];if(!row)throw new Error('Account status audit readback failed');
 return row.createdAt;
});
