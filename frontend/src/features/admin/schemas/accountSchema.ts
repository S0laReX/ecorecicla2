import {z} from 'zod';
export const accountStatusSchema=z.enum(['ACTIVE','PENDING','APPROVED','REJECTED','SUSPENDED']);
export const managedAccountSchema=z.object({
 userUUID:z.string().uuid(),displayName:z.string().min(2).max(120),email:z.string().email(),roleCode:z.enum(['USER','COMPANY']),
 accountStatus:z.enum(['ACTIVE','SUSPENDED']),verificationStatus:z.enum(['NOT_REQUIRED','PENDING','APPROVED','REJECTED']),
 status:accountStatusSchema,createdAt:z.string().min(1),updatedAt:z.string().min(1)
}).strict();
export const managedAccountsResponseSchema=z.object({
 success:z.literal(true),message:z.string(),data:z.array(managedAccountSchema),
 meta:z.object({total:z.number().int().nonnegative(),page:z.number().int().positive(),limit:z.number().int().positive()}).strict()
}).strict();
export const accountStatusResponseSchema=z.object({
 success:z.literal(true),message:z.string(),data:z.object({userUUID:z.string().uuid(),displayName:z.string(),roleCode:z.enum(['USER','COMPANY']),previousStatus:z.enum(['ACTIVE','SUSPENDED']),accountStatus:z.enum(['ACTIVE','SUSPENDED']),verificationStatus:z.enum(['NOT_REQUIRED','PENDING','APPROVED','REJECTED']),changedAt:z.string().min(1)}).strict()
}).strict();
