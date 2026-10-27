import type {z} from 'zod';
import type {pendingRatingSchema,profileRatingSchema,submittedRatingSchema} from '../schemas/ratingSchema';
export type PendingRating=z.infer<typeof pendingRatingSchema>;
export type ProfileRating=z.infer<typeof profileRatingSchema>;
export type SubmittedRating=z.infer<typeof submittedRatingSchema>;
