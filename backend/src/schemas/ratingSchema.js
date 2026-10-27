const {z}=require('zod');
const {uuidSchema}=require('./publicationSchema');
exports.ratingInputSchema=z.object({score:z.number().int().min(1).max(5)}).strict();
exports.ratingUUIDSchema=uuidSchema;
