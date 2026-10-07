import type {z} from 'zod';
import type {createPublicationSchema,publicationSchema,apiErrorSchema} from '../schemas/publicationSchema';
export type CreatePublicationInput = z.infer<typeof createPublicationSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
