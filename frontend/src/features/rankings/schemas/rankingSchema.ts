import {z} from 'zod';
import {metaSchema} from '../../rewards/schemas/rewardSchema';
const entrySchema=z.object({companyUUID:z.string().uuid(),companyName:z.string(),points:z.number().int().positive(),position:z.number().int().positive()});
export const rankingSchema=z.object({month:z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/),timeZone:z.literal('America/La_Paz'),items:z.array(entrySchema),ownEntry:entrySchema.nullable(),meta:metaSchema});
export type Ranking=z.infer<typeof rankingSchema>;
