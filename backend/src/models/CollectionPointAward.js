const {randomUUID}=require('node:crypto');const {z}=require('zod');
const {ownerIdSchema}=require('../schemas/publicationSchema');
const {modelGuard}=require('../utils/modelGuard');const CustomModelError=require('../utils/customModelError');
const awardSchema=z.object({reservationId:ownerIdSchema,recipientUserId:ownerIdSchema,recipientRole:z.enum(['PUBLISHER','COLLECTOR']),points:z.number().int().min(0).max(1000000)}).strict();
// CREATE — immutable ledger; no update or delete operations exposed.
/** RECORD ONE AWARD IN THE CONFIRMATION TRANSACTION
 * @param {import('zod').infer<typeof awardSchema>} data @param {import('mysql2/promise').PoolConnection} connection
 * @returns {Promise<void>}
 */
exports.create=(data,connection)=>modelGuard('CollectionPointAward','create',async()=>{
 const parsed=awardSchema.safeParse(data);if(!parsed.success)throw new CustomModelError('CollectionPointAward','Puntaje inválido.');
 const collectionPointAwardQuery='INSERT INTO CollectionPointAward (internalUUID,reservationId,recipientUserId,recipientRole,points,createdAt) VALUES (?,?,?,?,?,UTC_TIMESTAMP(3))';
 const collectionPointAwardParams=[randomUUID(),parsed.data.reservationId,parsed.data.recipientUserId,parsed.data.recipientRole,parsed.data.points];
 await connection.execute(collectionPointAwardQuery,collectionPointAwardParams);
});
