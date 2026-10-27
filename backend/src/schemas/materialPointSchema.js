const {z}=require('zod');
exports.materialTypeSchema=z.enum(['plastico','papel','vidrio','metal','organico']);
// Matches the existing immutable award ledger's supported range.
exports.materialPointInputSchema=z.object({
 publisherPoints:z.number().int().min(0).max(1000000),
 collectorPoints:z.number().int().min(0).max(1000000)
}).strict();
