const {z}=require('zod');
const {publicationFieldsSchema}=require('./publicationSchema');
exports.collectionQuerySchema=z.object({
 materialType:publicationFieldsSchema.shape.materialType.optional(),
 page:z.coerce.number().int().min(1).max(100000).default(1),
 limit:z.coerce.number().int().min(1).max(12).default(6)
}).strict();
