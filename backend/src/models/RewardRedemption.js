const {randomUUID}=require('node:crypto');
const {modelGuard}=require('../utils/modelGuard');
/** @typedef {import('mysql2/promise').PoolConnection} Connection */
const selection=`R.internalUUID AS redemptionUUID,W.internalUUID AS rewardUUID,R.rewardName,R.pointsCost,R.createdAt,R.deliveredAt`;
/** @param {import('mysql2').RowDataPacket} row */
const serialize=row=>({redemptionUUID:String(row.redemptionUUID),rewardUUID:String(row.rewardUUID),rewardName:String(row.rewardName),pointsCost:Number(row.pointsCost),createdAt:new Date(row.createdAt).toISOString(),deliveredAt:row.deliveredAt?new Date(row.deliveredAt).toISOString():null,...(row.userName!==undefined?{userName:String(row.userName),userEmail:String(row.userEmail)}:{})});
/** The caller holds the User row lock throughout every debit.
 * @param {string} id @param {Connection} connection */
exports.wallet=(id,connection)=>modelGuard('RewardRedemption','wallet',async()=>{
 const [rows]=await connection.execute(`SELECT
 (SELECT COALESCE(SUM(points),0) FROM CollectionPointAward WHERE recipientUserId=?) AS earnedPoints,
 (SELECT COALESCE(SUM(pointsCost),0) FROM RewardRedemption WHERE userId=?) AS spentPoints`,[id,id]);
 const row=/** @type {import('mysql2').RowDataPacket[]} */(rows)[0];const earnedPoints=Number(row.earnedPoints),spentPoints=Number(row.spentPoints);
 return {earnedPoints,spentPoints,availablePoints:earnedPoints-spentPoints};
});
/** @param {string} userId @param {string} requestUUID @param {Connection} connection */
exports.findRequest=(userId,requestUUID,connection)=>modelGuard('RewardRedemption','findRequest',async()=>{
 const [rows]=await connection.execute(`SELECT ${selection} FROM RewardRedemption R JOIN Reward W ON W.id=R.rewardId WHERE R.userId=? AND R.requestUUID=?`,[userId,requestUUID]);
 const row=/** @type {import('mysql2').RowDataPacket[]} */(rows)[0];return row?serialize(row):null;
});
/** @param {{userId:string,rewardId:string,rewardName:string,pointsCost:number,requestUUID:string}} input @param {Connection} connection */
exports.create=(input,connection)=>modelGuard('RewardRedemption','create',async()=>{
 await connection.execute('INSERT INTO RewardRedemption (internalUUID,requestUUID,userId,rewardId,rewardName,pointsCost) VALUES (?,?,?,?,?,?)',[randomUUID(),input.requestUUID,input.userId,input.rewardId,input.rewardName,input.pointsCost]);
 return exports.findRequest(input.userId,input.requestUUID,connection);
});
/** @param {string|null} userId @param {{page:number,limit:number,status:string}} query @param {Connection} connection */
exports.list=(userId,query,connection)=>modelGuard('RewardRedemption','list',async()=>{
 const clauses=['1=1'];const params=[];
 if(userId){clauses.push('R.userId=?');params.push(userId);}
 if(query.status!=='ALL')clauses.push(query.status==='PENDING'?'R.deliveredAt IS NULL':'R.deliveredAt IS NOT NULL');
 const where=clauses.join(' AND ');
 const [counts]=await connection.execute(`SELECT COUNT(*) AS total FROM RewardRedemption R WHERE ${where}`,params);
 const [rows]=await connection.execute(`SELECT ${selection}${userId?'':',U.displayName AS userName,U.email AS userEmail'} FROM RewardRedemption R JOIN Reward W ON W.id=R.rewardId JOIN User U ON U.id=R.userId WHERE ${where} ORDER BY R.createdAt DESC,R.id DESC LIMIT ? OFFSET ?`,[...params,String(query.limit),String((query.page-1)*query.limit)]);
 return {items:/** @type {import('mysql2').RowDataPacket[]} */(rows).map(serialize),meta:{page:query.page,limit:query.limit,total:Number(/** @type {import('mysql2').RowDataPacket[]} */(counts)[0].total)}};
});
/** @param {string} uuid @param {string} adminId @param {Connection} connection */
exports.deliver=(uuid,adminId,connection)=>modelGuard('RewardRedemption','deliver',async()=>{
 await connection.execute('UPDATE RewardRedemption SET deliveredAt=UTC_TIMESTAMP(3),deliveredByUserId=? WHERE internalUUID=? AND deliveredAt IS NULL',[adminId,uuid]);
 const [rows]=await connection.execute(`SELECT ${selection} FROM RewardRedemption R JOIN Reward W ON W.id=R.rewardId WHERE R.internalUUID=?`,[uuid]);
 const row=/** @type {import('mysql2').RowDataPacket[]} */(rows)[0];return row?serialize(row):null;
});
