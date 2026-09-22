import {createPublicationSchema,createResponseSchema,apiErrorSchema} from '../schemas/publicationSchema';
import {authenticatedRequest,ApiRequestError} from '../../auth/services/sessionService';
import {publicationSchema} from '../schemas/publicationSchema';
import type {CreatePublicationInput,Publication,ApiError} from '../types/publication';
export class PublicationRequestError extends Error {
 constructor(public readonly failure:ApiError) { super(failure.message); }
}
export async function createPublicationRequest(input:CreatePublicationInput,signal:AbortSignal):Promise<Publication> {
 const fields = createPublicationSchema.parse(input);
 const body = new FormData();
 body.append('materialType',fields.materialType);body.append('quantityKg',fields.quantityKg);
 body.append('locationText',fields.locationText);body.append('availabilityText',fields.availabilityText);body.append('photo',fields.photo);
 try{return publicationSchema.parse(await authenticatedRequest('/publications',{method:'POST',body,signal}));}
 catch(error){if(error instanceof ApiRequestError)throw new PublicationRequestError({success:false,message:error.message,errorCode:error.errorCode,statusCode:error.statusCode});throw error;}
}
