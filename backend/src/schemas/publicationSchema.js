const { z } = require('zod');
const text = (/** @type {number} */ max) => z.string().trim().min(3).max(max).refine(v => !/[\x00-\x1f\x7f]/.test(v));
exports.publicationFieldsSchema = z.object({
  materialType:z.enum(['plastico','papel','vidrio','metal','organico']),
  // Decimal text prevents float rounding and silent DECIMAL truncation.
  quantityKg:z.string().regex(/^(?:0|[1-9]\d{0,6})(?:\.\d{1,3})?$/).refine(v=>Number(v)>0),
  locationText:text(300),availabilityText:text(200)
}).strict();
exports.uuidSchema = z.string().uuid();
exports.ownerIdSchema = z.string().regex(/^[1-9]\d{0,19}$/);
exports.photoSchema = z.instanceof(Buffer).refine(v=>v.length>=4 && v.length<=1048576 && v[0]===255 && v[1]===216 && v[v.length-2]===255 && v[v.length-1]===217);
