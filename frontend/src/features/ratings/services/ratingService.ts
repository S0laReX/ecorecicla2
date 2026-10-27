import {authenticatedRequest} from '../../auth/services/sessionService';
import {pendingRatingsSchema,profileRatingSchema,submittedRatingSchema} from '../schemas/ratingSchema';
export async function listPendingRatings(){return pendingRatingsSchema.parse(await authenticatedRequest('/ratings/pending'));}
export async function readMyProfileRating(){return profileRatingSchema.parse(await authenticatedRequest('/ratings/me'));}
export async function submitRating(reservationUUID:string,score:number){return submittedRatingSchema.parse(await authenticatedRequest(`/ratings/reservations/${encodeURIComponent(reservationUUID)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({score})}));}
