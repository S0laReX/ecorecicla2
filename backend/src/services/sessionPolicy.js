const User=require('../models/User');const AuthSession=require('../models/AuthSession');const CustomModelError=require('../utils/customModelError');
/** @typedef {{userUUID:string,tokenVersion:number,sessionUUID:string}} AuthContext */
/** ENFORCE ACCOUNT ACCESS @param {import('../models/User').UserContext|null} user @param {boolean} [allowRejected] @returns {asserts user is import('../models/User').UserContext} */
function assertActive(user,allowRejected=false){
 if(!user)throw new CustomModelError('User','La sesión ya no es válida.','SESSION_INVALID',401);
 if(user.userAccountStatus!=='ACTIVE')throw new CustomModelError('User','Tu cuenta está suspendida.','ACCOUNT_SUSPENDED',403);
 if(!allowRejected&&user.userRoleCode==='COMPANY'&&!['PENDING','APPROVED'].includes(user.userVerificationStatus))throw new CustomModelError('User','Tu solicitud empresarial fue rechazada.','COMPANY_REJECTED',403);
}
/** LOCK AND AUTHORIZE CURRENT SESSION @param {AuthContext} auth @param {import('mysql2/promise').PoolConnection} connection @param {boolean} [allowRejected] @returns {Promise<import('../models/User').UserContext>} */
async function lockSessionUser(auth,connection,allowRejected=false){
 const user=await User.findContextForUpdate(auth.userUUID,connection);assertActive(user,allowRejected);
 if(user.userTokenVersion!==auth.tokenVersion)throw new CustomModelError('User','La sesión ya no es válida.','SESSION_INVALID',401);
 const session=await AuthSession.findByUUID(auth.sessionUUID,connection,true);
 if(!session||session.sessionUserId!==user.userId||session.sessionRevokedAt||session.sessionExpiresAt.getTime()<=Date.now())throw new CustomModelError('User','La sesión expiró o fue cerrada.','SESSION_INVALID',401);
 return user;
}
module.exports={assertActive,lockSessionUser};
