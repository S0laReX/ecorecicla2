const defaults=require('../constants/materialPoints');
const {materialTypeSchema,materialPointInputSchema}=require('../schemas/materialPointSchema');
const {modelGuard}=require('../utils/modelGuard');
const CustomModelError=require('../utils/customModelError');
/** @typedef {import('mysql2/promise').PoolConnection} Connection */
/** @typedef {{materialType:string,publisherPoints:number,collectorPoints:number,isDefault:boolean}} PointSetting */
/** READ EFFECTIVE SETTINGS, INCLUDING DEFAULTS FOR UNCONFIGURED MATERIALS
 * @param {Connection} connection @returns {Promise<PointSetting[]>}
 */
exports.findAll=connection=>modelGuard('MaterialPointSetting','findAll',async()=>{
 const [rows]=await connection.execute('SELECT materialType,publisherPoints,collectorPoints FROM MaterialPointSetting');
 const configured=/** @type {import('mysql2').RowDataPacket[]} */(rows);
 return Object.entries(defaults).map(([materialType,value])=>{
  const row=configured.find(item=>item.materialType===materialType);
  return {materialType,publisherPoints:row?Number(row.publisherPoints):value.publisher,collectorPoints:row?Number(row.collectorPoints):value.collector,isDefault:!row};
 });
});
/** READ BOTH VALUES IN ONE STATEMENT AT CONFIRMATION TIME
 * @param {string} materialType @param {Connection} connection
 * @returns {Promise<{publisher:number,collector:number}>}
 */
exports.readEffective=(materialType,connection)=>modelGuard('MaterialPointSetting','readEffective',async()=>{
 const parsed=materialTypeSchema.safeParse(materialType);
 if(!parsed.success)throw new CustomModelError('MaterialPointSetting','Material inválido.');
 const [rows]=await connection.execute('SELECT publisherPoints,collectorPoints FROM MaterialPointSetting WHERE materialType=? FOR SHARE',[parsed.data]);
 const row=/** @type {import('mysql2').RowDataPacket[]} */(rows)[0];
 return row?{publisher:Number(row.publisherPoints),collector:Number(row.collectorPoints)}:defaults[parsed.data];
});
/** UPSERT BOTH PARTICIPANT VALUES ATOMICALLY
 * @param {string} materialType @param {import('zod').infer<typeof materialPointInputSchema>} input @param {Connection} connection
 */
exports.save=(materialType,input,connection)=>modelGuard('MaterialPointSetting','save',async()=>{
 if(!materialTypeSchema.safeParse(materialType).success||!materialPointInputSchema.safeParse(input).success)throw new CustomModelError('MaterialPointSetting','Puntos inválidos.');
 await connection.execute(`INSERT INTO MaterialPointSetting (materialType,publisherPoints,collectorPoints,updatedAt)
 VALUES (?,?,?,UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE publisherPoints=?,collectorPoints=?,updatedAt=UTC_TIMESTAMP(3)`,
 [materialType,input.publisherPoints,input.collectorPoints,input.publisherPoints,input.collectorPoints]);
 return {materialType,...input,isDefault:false};
});
