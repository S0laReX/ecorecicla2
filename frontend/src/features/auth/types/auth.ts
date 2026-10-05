import {z} from 'zod';
export const userSchema=z.object({userUUID:z.string().uuid(),displayName:z.string(),email:z.string().email(),roleCode:z.enum(['USER','COMPANY','ADMIN']),accountStatus:z.enum(['ACTIVE','SUSPENDED']),verificationStatus:z.enum(['PENDING','APPROVED','REJECTED','NOT_REQUIRED'])});
export const sessionSchema=z.object({user:userSchema,tokens:z.object({accessToken:z.string(),refreshToken:z.string(),expiresIn:z.literal(1800)})});
export type User=z.infer<typeof userSchema>;
export type Session=z.infer<typeof sessionSchema>;
