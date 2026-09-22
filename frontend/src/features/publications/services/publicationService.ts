import {createPublicationSchema,createResponseSchema,apiErrorSchema} from '../schemas/publicationSchema';
import {STORAGE_KEYS} from '../../auth/constants/storageKeys';
import type {CreatePublicationInput,Publication,ApiError} from '../types/publication';
export class PublicationRequestError extends Error {
 constructor(public readonly failure:ApiError) { super(failure.message); }
}
export async function createPublicationRequest(input:CreatePublicationInput,signal:AbortSignal):Promise<Publication> {
 const fields = createPublicationSchema.parse(input);
 const token = typeof window==='undefined' ? null : window.localStorage.getItem(STORAGE_KEYS.access);
 if (!token) throw new PublicationRequestError({success:false,message:'Inicia sesión para publicar.',errorCode:'AUTH_REQUIRED',statusCode:401});
 const body = new FormData();
 body.append('materialType',fields.materialType);body.append('quantityKg',fields.quantityKg);
 body.append('locationText',fields.locationText);body.append('availabilityText',fields.availabilityText);body.append('photo',fields.photo);
 const response = await fetch('/api/publications',{method:'POST',headers:{Authorization:`Bearer ${token}`},body,signal,cache:'no-store'});
 const json:unknown = await response.json();
 if (!response.ok) {
  const parsed = apiErrorSchema.safeParse(json);
  throw new PublicationRequestError(parsed.success && parsed.data.statusCode===response.status ? parsed.data :
    {success:false,message:'No se pudo completar la solicitud.',errorCode:'HTTP_ERROR',statusCode:response.status});
 }
 return createResponseSchema.parse(json).data;
}
