import {z} from 'zod';
export const profileRatingSchema=z.object({average:z.number().min(1).max(5).nullable(),count:z.number().int().nonnegative()}).strict();
export const pendingRatingSchema=z.object({reservationUUID:z.string().uuid(),confirmedAt:z.string(),materialType:z.enum(['plastico','papel','vidrio','metal','organico']),quantityKg:z.string(),ratedUserUUID:z.string().uuid(),ratedDisplayName:z.string(),ratedAverage:z.number().min(1).max(5).nullable(),ratedCount:z.number().int().nonnegative()}).strict();
export const pendingRatingsSchema=z.object({items:z.array(pendingRatingSchema)}).strict();
export const submittedRatingSchema=z.object({reservationUUID:z.string().uuid(),ratedUserUUID:z.string().uuid(),score:z.number().int().min(1).max(5),createdAt:z.string(),average:z.number().min(1).max(5).nullable(),count:z.number().int().positive()}).strict();
