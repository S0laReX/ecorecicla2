import type {z} from 'zod';
import type {accountStatusSchema,managedAccountSchema} from '../schemas/accountSchema';
export type AccountStatus=z.infer<typeof accountStatusSchema>;
export type ManagedAccount=z.infer<typeof managedAccountSchema>;
export type AccountStatusFilter='ALL'|'ACTIVE'|'PENDING'|'APPROVED'|'REJECTED'|'SUSPENDED';
