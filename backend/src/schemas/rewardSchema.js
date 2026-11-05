const {z}=require('zod');
const text=(/** @type {number} */max)=>z.string().trim().max(max).refine(value=>!/[\x00-\x1f\x7f]/.test(value));
exports.rewardInputSchema=z.object({name:text(120).pipe(z.string().min(2)),description:text(1000),pointsCost:z.number().int().min(1).max(1000000),stock:z.number().int().min(0).max(1000000),isActive:z.boolean()}).strict();
exports.rewardUpdateSchema=exports.rewardInputSchema.extend({version:z.number().int().positive().max(4294967294)}).strict();
exports.redemptionInputSchema=z.object({requestUUID:z.string().uuid(),expectedPointsCost:z.number().int().min(1).max(1000000)}).strict();
exports.pageQuerySchema=z.object({page:z.coerce.number().int().min(1).max(100000).default(1),limit:z.coerce.number().int().min(1).max(50).default(12)}).strict();
exports.redemptionQuerySchema=exports.pageQuerySchema.extend({status:z.enum(['ALL','PENDING','DELIVERED']).default('ALL')}).strict();
exports.rankingQuerySchema=exports.pageQuerySchema.extend({month:z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/).optional()}).strict();
