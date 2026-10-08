import {z} from 'zod';
import {publicationSchema} from '../../publications/schemas/publicationSchema';
export const availablePublicationSchema=publicationSchema.extend({publicationStatus:z.literal('disponible'),publisherName:z.string().min(1).max(120)}).strict();
export const availablePageSchema=z.object({publications:z.array(availablePublicationSchema),meta:z.object({total:z.number().int().nonnegative(),page:z.number().int().positive(),limit:z.number().int().min(1).max(12)})});
