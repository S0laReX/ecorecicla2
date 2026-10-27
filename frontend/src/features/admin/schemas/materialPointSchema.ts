import {z} from 'zod';
export const materialTypeSchema=z.enum(['plastico','papel','vidrio','metal','organico']);
export const pointValuesSchema=z.object({publisherPoints:z.number().int().min(0).max(1000000),collectorPoints:z.number().int().min(0).max(1000000)}).strict();
export const materialPointSchema=pointValuesSchema.extend({materialType:materialTypeSchema,isDefault:z.boolean()});
export const materialPointsResponseSchema=z.object({success:z.literal(true),message:z.string(),data:z.array(materialPointSchema).length(5)});
export const materialPointResponseSchema=z.object({success:z.literal(true),message:z.string(),data:materialPointSchema});
export type MaterialPoint=z.infer<typeof materialPointSchema>;
export type PointValues=z.infer<typeof pointValuesSchema>;
