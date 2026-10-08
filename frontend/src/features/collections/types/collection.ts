import type {z} from 'zod';
import type {availablePublicationSchema} from '../schemas/collectionSchema';
import type {MATERIAL_TYPES} from '../constants/collectionConstants';
export type AvailablePublication=z.infer<typeof availablePublicationSchema>;
export type MaterialFilter=typeof MATERIAL_TYPES[number]|'';
export interface CollectionFilter{materialType:MaterialFilter;page:number}
