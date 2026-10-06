import {z} from 'zod';
export const companyApplicationSchema=z.object({
 companyUUID:z.string().uuid(),companyName:z.string().min(2),companyEmail:z.string().email(),
 companyTaxIdentifier:z.string(),companyContactName:z.string(),companyCoverageArea:z.string(),
 companyVerificationStatus:z.literal('PENDING'),companyCreatedAt:z.string().min(1)
}).strict();
export const companyApplicationPageSchema=z.object({
 success:z.literal(true),message:z.string(),data:z.array(companyApplicationSchema),
 meta:z.object({total:z.number().int().nonnegative(),page:z.number().int().positive(),limit:z.number().int().positive()}).strict()
}).strict();
export const companyDecisionResponseSchema=z.object({
 companyUUID:z.string().uuid(),verificationStatus:z.enum(['APPROVED','REJECTED']),decisionAt:z.string()
}).strict();
export const rejectionReasonSchema=z.string().trim().min(3,'Escribe un motivo de al menos 3 caracteres.').max(300,'El motivo no puede superar 300 caracteres.').refine(value=>!/[\x00-\x1f\x7f]/.test(value),'El motivo contiene caracteres no permitidos.');
