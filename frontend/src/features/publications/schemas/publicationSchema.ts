import {z} from 'zod';
import {MATERIAL_TYPES,MAX_PHOTO_BYTES} from '../constants/publicationConstants';
const text = (max:number)=>z.string().trim().min(3,'Escribe al menos 3 caracteres.').max(max).refine(v=>!/[\x00-\x1f\x7f]/.test(v),'Texto no válido.');
export const publicationFieldsSchema = z.object({
 materialType:z.enum(MATERIAL_TYPES),
 quantityKg:z.string().regex(/^(?:0|[1-9]\d{0,6})(?:\.\d{1,3})?$/,'Usa hasta 3 decimales, separados por punto.').refine(v=>Number(v)>0,'La cantidad debe ser mayor que cero.'),
 locationText:text(300),availabilityText:text(200)
}).strict();
export const createPublicationSchema = publicationFieldsSchema.extend({
 photo:z.custom<File>((v:unknown)=>typeof File!=='undefined' && v instanceof File,'Adjunta una foto.')
  .refine(f=>!f || (f.size>0 && f.size<=MAX_PHOTO_BYTES),'La foto debe pesar entre 1 byte y 5 MiB.')
  .refine(f=>!f || ['image/jpeg','image/png','image/webp'].includes(f.type),'Usa JPEG, PNG o WebP.')
}).strict();
export const publicationSchema = z.object({
 publicationUUID:z.string().uuid(),publicationMaterialType:z.enum(MATERIAL_TYPES),
 publicationQuantityKg:z.string(),publicationLocationText:z.string(),publicationAvailabilityText:z.string(),
 publicationStatus:z.enum(['disponible','aceptada','confirmada']),
 publicationPhotoDataUrl:z.string().max(1400000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/)
}).strict();
export const apiErrorSchema = z.object({success:z.literal(false),message:z.string(),errorCode:z.string(),statusCode:z.number().int()});
export const createResponseSchema = z.object({success:z.literal(true),message:z.string(),data:publicationSchema});
