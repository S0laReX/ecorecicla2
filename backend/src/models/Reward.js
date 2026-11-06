const {randomUUID}=require('node:crypto');
const {modelGuard}=require('../utils/modelGuard');
const CustomModelError=require('../utils/customModelError');
/** @typedef {import('mysql2/promise').PoolConnection} Connection */
/** @typedef {import('zod').infer<typeof import('../schemas/rewardSchema').rewardInputSchema>} RewardInput */
const selection='internalUUID AS rewardUUID,name,description,pointsCost,stock,isActive,version';
/** @param {import('mysql2').RowDataPacket} row */
const serialize=row=>({rewardUUID:String(row.rewardUUID),name:String(row.name),description:String(row.description),pointsCost:Number(row.pointsCost),stock:Number(row.stock),isActive:Boolean(row.isActive),version:Number(row.version)});
/** @param {boolean} admin @param {{page:number,limit:number}} query @param {Connection} connection */
exports.list=(admin,query,connection)=>modelGuard('Reward','list',async()=>{
 const where=admin?'':' WHERE isActive=1';
 const [counts]=await connection.execute(`SELECT COUNT(*) AS total FROM Reward${where}`);
 const [rows]=await connection.execute(`SELECT ${selection} FROM Reward${where} ORDER BY createdAt DESC,id DESC LIMIT ? OFFSET ?`,[String(query.limit),String((query.page-1)*query.limit)]);
 return {items:/** @type {import('mysql2').RowDataPacket[]} */(rows).map(serialize),meta:{...query,total:Number(/** @type {import('mysql2').RowDataPacket[]} */(counts)[0].total)}};
});
/** @param {string} uuid @param {Connection} connection @param {boolean} [lock] */
exports.find=(uuid,connection,lock=false)=>modelGuard('Reward','find',async()=>{
 const [rows]=await connection.execute(`SELECT CAST(id AS CHAR) AS rewardId,${selection} FROM Reward WHERE internalUUID=?${lock?' FOR UPDATE':''}`,[uuid]);
 const row=/** @type {import('mysql2').RowDataPacket[]} */(rows)[0];return row?{...serialize(row),rewardId:String(row.rewardId)}:null;
});
/** @param {RewardInput} input @param {Connection} connection */
exports.create=(input,connection)=>modelGuard('Reward','create',async()=>{
 const uuid=randomUUID();await connection.execute('INSERT INTO Reward (internalUUID,name,description,pointsCost,stock,isActive) VALUES (?,?,?,?,?,?)',[uuid,input.name,input.description,input.pointsCost,input.stock,input.isActive]);
 const result=await exports.find(uuid,connection);if(!result)throw new Error('Reward creation failed');const {rewardId,...reward}=result;return reward;
});
/** @param {string} uuid @param {RewardInput & {version:number}} input @param {Connection} connection */
exports.update=(uuid,input,connection)=>modelGuard('Reward','update',async()=>{
 const [result]=await connection.execute('UPDATE Reward SET name=?,description=?,pointsCost=?,stock=?,isActive=?,version=version+1,updatedAt=UTC_TIMESTAMP(3) WHERE internalUUID=? AND version=?',[input.name,input.description,input.pointsCost,input.stock,input.isActive,uuid,input.version]);
 if(/** @type {import('mysql2').ResultSetHeader} */(result).affectedRows!==1)throw new CustomModelError('Reward','El premio cambió o se canjeó una unidad. Recarga el catálogo antes de editarlo.','REWARD_CHANGED',409);
 const saved=await exports.find(uuid,connection);if(!saved)throw new Error('Reward update failed');const {rewardId,...reward}=saved;return reward;
});
/** @param {string} id @param {Connection} connection */
exports.takeStock=(id,connection)=>modelGuard('Reward','takeStock',async()=>{
 const [result]=await connection.execute('UPDATE Reward SET stock=stock-1,version=version+1,updatedAt=UTC_TIMESTAMP(3) WHERE id=? AND stock>0 AND isActive=1',[id]);
 if(/** @type {import('mysql2').ResultSetHeader} */(result).affectedRows!==1)throw new CustomModelError('Reward','Este premio ya no tiene existencias.','REWARD_OUT_OF_STOCK',409);
});
