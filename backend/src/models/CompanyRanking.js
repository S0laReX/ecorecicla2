const {modelGuard}=require('../utils/modelGuard');
/** @param {{start:Date,end:Date}} bounds @param {{page:number,limit:number}} query @param {string|null} ownUUID @param {import('mysql2/promise').PoolConnection} connection */
exports.read=(bounds,query,ownUUID,connection)=>modelGuard('CompanyRanking','read',async()=>{
 const ranked=`WITH totals AS (
 SELECT U.internalUUID AS companyUUID,U.displayName AS companyName,SUM(A.points) AS points
 FROM User U JOIN CollectionPointAward A ON A.recipientUserId=U.id
 WHERE U.roleCode='COMPANY' AND U.accountStatus='ACTIVE' AND U.verificationStatus='APPROVED' AND U.deletedAt IS NULL
 AND A.createdAt>=? AND A.createdAt<? GROUP BY U.id,U.internalUUID,U.displayName HAVING SUM(A.points)>0
 ), ranked AS (SELECT *,RANK() OVER (ORDER BY points DESC) AS position FROM totals)`;
 const params=[bounds.start,bounds.end];
 const [counts]=await connection.execute(`${ranked} SELECT COUNT(*) AS total FROM ranked`,params);
 const [rows]=await connection.execute(`${ranked} SELECT * FROM ranked ORDER BY points DESC,companyName,companyUUID LIMIT ? OFFSET ?`,[...params,String(query.limit),String((query.page-1)*query.limit)]);
 /** @param {import('mysql2').RowDataPacket} row */
 const serialize=row=>({...row,points:Number(row.points),position:Number(row.position)});
 let ownEntry=null;
 if(ownUUID){const [own]=await connection.execute(`${ranked} SELECT * FROM ranked WHERE companyUUID=?`,[...params,ownUUID]);const row=/** @type {import('mysql2').RowDataPacket[]} */(own)[0];if(row)ownEntry=serialize(row);}
 return {items:/** @type {import('mysql2').RowDataPacket[]} */(rows).map(serialize),ownEntry,meta:{page:query.page,limit:query.limit,total:Number(/** @type {import('mysql2').RowDataPacket[]} */(counts)[0].total)}};
});
