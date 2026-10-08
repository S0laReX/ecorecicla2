const {z}=require('zod');
const {uuidSchema}=require('./publicationSchema');
exports.acceptReservationSchema=z.object({scheduledAt:z.string().datetime({offset:true})}).strict();
exports.agendaQuerySchema=z.object({page:z.coerce.number().int().min(1).max(100000).default(1),limit:z.coerce.number().int().min(1).max(12).default(6)}).strict();
exports.reservationUUIDSchema=uuidSchema;
