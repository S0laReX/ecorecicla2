import {z} from 'zod';
import {MATERIAL_TYPES} from '../../publications/constants/publicationConstants';
export const agendaReservationSchema=z.object({
 reservationUUID:z.string().uuid(),reservationPublicationUUID:z.string().uuid(),
 reservationScheduledAt:z.string().datetime(),reservationStatus:z.literal('ACEPTADA'),
 publicationMaterialType:z.enum(MATERIAL_TYPES),publicationQuantityKg:z.string(),
 publicationLocationText:z.string(),publicationAvailabilityText:z.string(),
 publicationPhotoDataUrl:z.string().max(1400000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/),
 publisherName:z.string().min(1).max(120)
}).strict();
export const agendaPageSchema=z.object({
 reservations:z.array(agendaReservationSchema),
 meta:z.object({total:z.number().int().nonnegative(),page:z.number().int().positive(),limit:z.number().int().min(1).max(12)})
}).strict();
export const acceptedReservationSchema=z.object({reservationUUID:z.string().uuid(),publicationUUID:z.string().uuid(),scheduledAt:z.string().datetime()}).strict();
export const cancelledReservationSchema=z.object({reservationUUID:z.string().uuid(),publicationUUID:z.string().uuid(),publicationStatus:z.literal('disponible')}).strict();
