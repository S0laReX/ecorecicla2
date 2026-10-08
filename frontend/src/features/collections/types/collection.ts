import type {z} from 'zod';
import type {availablePublicationSchema} from '../schemas/collectionSchema';
import type {MATERIAL_TYPES} from '../constants/collectionConstants';
import type {agendaReservationSchema} from '../schemas/reservationSchema';
export type AvailablePublication=z.infer<typeof availablePublicationSchema>;
export type MaterialFilter=typeof MATERIAL_TYPES[number]|'';
export interface CollectionFilter{materialType:MaterialFilter;page:number}
export type AgendaReservation=z.infer<typeof agendaReservationSchema>;
export type ConfirmationResult=z.infer<typeof import('../schemas/reservationSchema').confirmedReservationSchema>;
