import {createPublicationSchema} from '../schemas/publicationSchema';
import {z} from 'zod';
import {authenticatedRequest,ApiRequestError} from '../../auth/services/sessionService';
import {publicationSchema} from '../schemas/publicationSchema';
import type {CreatePublicationInput,Publication,ApiError} from '../types/publication';
export class PublicationRequestError extends Error {
 constructor(public readonly failure:ApiError) { super(failure.message); }
}
const collectionSchema=z.object({success:z.literal(true),data:z.array(publicationSchema),meta:z.object({total:z.number().int().nonnegative(),page:z.number().int().positive(),limit:z.number().int().positive()})});
export async function listOwnPublications(page=1,signal?:AbortSignal){return collectionSchema.parse(await authenticatedRequest(`/publications/me?page=${page}&limit=6`,{signal},true));}
export async function retrievePublication(publicationUUID:string){return publicationSchema.parse(await authenticatedRequest(`/publications/${encodeURIComponent(publicationUUID)}`));}
export async function updatePublication(publicationUUID:string,input:Record<string,unknown>){
 const body=new FormData();for(const [key,value]of Object.entries(input)){if(value instanceof File)body.append(key,value);else if(typeof value==='string')body.append(key,value);}
 return publicationSchema.parse(await authenticatedRequest(`/publications/${encodeURIComponent(publicationUUID)}`,{method:'PATCH',body}));
}
export async function deletePublication(publicationUUID:string){await authenticatedRequest(`/publications/${encodeURIComponent(publicationUUID)}`,{method:'DELETE'});}
export async function createPublicationRequest(input:CreatePublicationInput,signal:AbortSignal):Promise<Publication> {
 const fields = createPublicationSchema.parse(input);
 const body = new FormData();
 body.append('materialType',fields.materialType);body.append('quantityKg',fields.quantityKg);
 body.append('locationText',fields.locationText);body.append('availabilityText',fields.availabilityText);body.append('photo',fields.photo);
 try{return publicationSchema.parse(await authenticatedRequest('/publications',{method:'POST',body,signal}));}
 catch(error){if(error instanceof ApiRequestError)throw new PublicationRequestError({success:false,message:error.message,errorCode:error.errorCode,statusCode:error.statusCode});throw error;}
}
