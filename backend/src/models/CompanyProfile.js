const {z}=require('zod');
const {ownerIdSchema}=require('../schemas/publicationSchema');
const CustomModelError=require('../utils/customModelError');
const {modelGuard}=require('../utils/modelGuard');
const schema=z.object({userId:ownerIdSchema,taxIdentifier:z.string().regex(/^[A-Za-z0-9-]{4,40}$/),contactName:z.string().min(2).max(120),coverageArea:z.string().min(3).max(300),documentContent:z.instanceof(Buffer).refine(b=>b.length>3&&b.length<=5242880),documentMime:z.enum(['application/pdf','image/jpeg'])}).strict();
/** CREATE COMPANY PROFILE @param {import('zod').infer<typeof schema>} data @param {import('mysql2/promise').PoolConnection} connection @returns {Promise<void>} */
exports.create=(data,connection)=>modelGuard('CompanyProfile','create',async()=>{
 const parsed=schema.safeParse(data);if(!parsed.success)throw new CustomModelError('CompanyProfile','Datos empresariales inválidos.');
 const companyProfileQuery='INSERT INTO CompanyProfile (userId,taxIdentifier,contactName,coverageArea,documentContent,documentMime) VALUES (?,?,?,?,?,?)';
 const companyProfileParams=[data.userId,data.taxIdentifier,data.contactName,data.coverageArea,data.documentContent,data.documentMime];
 await connection.execute(companyProfileQuery,companyProfileParams);
});
