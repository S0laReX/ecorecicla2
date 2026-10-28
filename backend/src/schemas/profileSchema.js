const {z}=require('zod');
const text=(/** @type {number} */max)=>z.string().trim().max(max).refine(value=>!/[\x00-\x1f\x7f]/.test(value));
exports.profileInputSchema=z.object({displayName:text(120).pipe(z.string().min(2)),contact:text(120),address:text(300)}).strict();
exports.historyQuerySchema=z.object({status:z.enum(['ALL','ACEPTADA','CONFIRMADA','CANCELADA','VENCIDA']).default('ALL'),page:z.coerce.number().int().min(1).max(100000).default(1),limit:z.coerce.number().int().min(1).max(50).default(10)}).strict();
