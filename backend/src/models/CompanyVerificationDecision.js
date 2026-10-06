const {randomUUID}=require('node:crypto');
const {z}=require('zod');
const CustomModelError=require('../utils/customModelError');
const {modelGuard}=require('../utils/modelGuard');
const {ownerIdSchema}=require('../schemas/publicationSchema');
const decisionSchema=z.object({companyUserId:ownerIdSchema,adminUserId:ownerIdSchema,decision:z.enum(['APPROVED','REJECTED']),reason:z.string().trim().min(3).max(300).nullable()}).strict().superRefine((value,context)=>{
 if(value.decision==='REJECTED'&&!value.reason)context.addIssue({code:'custom',path:['reason'],message:'El motivo es obligatorio.'});
 if(value.decision==='APPROVED'&&value.reason!==null)context.addIssue({code:'custom',path:['reason'],message:'La aprobación no admite motivo.'});
});
/** RECORD COMPANY VERIFICATION DECISION @param {import('zod').infer<typeof decisionSchema>} data @param {import('mysql2/promise').PoolConnection} connection */
exports.create=(data,connection)=>modelGuard('CompanyVerificationDecision','create',async()=>{
 const parsed=decisionSchema.safeParse(data);if(!parsed.success)throw new CustomModelError('CompanyVerificationDecision','Decisión de verificación inválida.');
 const decisionData=parsed.data;
 const companyVerificationDecisionQuery='INSERT INTO CompanyVerificationDecision (internalUUID,companyUserId,adminUserId,decision,reason,createdAt) VALUES (?,?,?,?,?,UTC_TIMESTAMP(3))';
 const companyVerificationDecisionParams=[randomUUID(),decisionData.companyUserId,decisionData.adminUserId,decisionData.decision,decisionData.reason];
 await connection.execute(companyVerificationDecisionQuery,companyVerificationDecisionParams);
 const companyVerificationDecisionReadQuery='SELECT D.createdAt AS companyVerificationDecisionAt FROM CompanyVerificationDecision D WHERE D.internalUUID = ? LIMIT 1';
 const companyVerificationDecisionReadParams=[companyVerificationDecisionParams[0]];
 const [decisions]=await connection.execute(companyVerificationDecisionReadQuery,companyVerificationDecisionReadParams);
 const decision=/** @type {import('mysql2').RowDataPacket[]} */(decisions)[0];
 if(!decision)throw new Error('Company decision readback failed');
 return decision.companyVerificationDecisionAt;
});
