const User=require('../models/User');
const AuthSession=require('../models/AuthSession');
const AccountStatusAudit=require('../models/AccountStatusAudit');
const {transaction}=require('./transactionService');
const {lockSessionUser}=require('./sessionPolicy');
const CustomModelError=require('../utils/customModelError');
const {AuditService}=require('./auditService');

/** @param {import('./sessionPolicy').AuthContext} auth @param {import('mysql2/promise').PoolConnection} connection */
async function requireAdministrator(auth,connection){
 const user=await lockSessionUser(auth,connection);
 if(user.userRoleCode!=='ADMIN')throw new CustomModelError('User','No tienes permiso para administrar cuentas.','ROLE_FORBIDDEN',403);
 return user;
}

/** LIST USERS AND COMPANIES FOR ADMINISTRATION
 * @param {import('./sessionPolicy').AuthContext} auth
 * @param {{page:number,limit:number,search:string,status:string}} query
 */
/** @param {import('./sessionPolicy').AuthContext} auth @param {{page:number,limit:number,search:string,status:string}} query */
exports.listAccounts=async(auth,query)=>transaction(async connection=>{
 await requireAdministrator(auth,connection);
 const total=await User.readAdminAccountCount(query.search,query.status,connection);
 const accounts=await User.findAdminAccounts(query.page,query.limit,query.search,query.status,connection);
 return {accounts,meta:{total,page:query.page,limit:query.limit}};
});

/** SUSPEND OR REACTIVATE AN ACCOUNT, REVOKING ALL ITS EXISTING SESSIONS
 * @param {import('./sessionPolicy').AuthContext} auth
 * @param {string} userUUID
 * @param {'ACTIVE'|'SUSPENDED'} nextStatus
 */
exports.changeAccountStatus=async(auth,userUUID,nextStatus)=>{
 const result=await transaction(async connection=>{
  const administrator=await requireAdministrator(auth,connection);
  const target=await User.findManageableAccountByUUIDForUpdate(userUUID,connection);
  if(!target)throw new CustomModelError('User','Cuenta no encontrada.','ACCOUNT_NOT_FOUND',404);
  if(target.accountStatus===nextStatus)throw new CustomModelError('User','La cuenta ya tiene ese estado. Actualiza el listado.','ACCOUNT_STATUS_CONFLICT',409);
  await User.updateAccountStatus(target.userId,target.accountStatus,nextStatus,connection);
  await AuthSession.revokeByUser(target.userId,connection);
  const changedAt=await AccountStatusAudit.create({targetUserId:target.userId,actorAdminId:administrator.userId,previousStatus:target.accountStatus,newStatus:nextStatus},connection);
  return {administratorUUID:administrator.userUUID,userUUID:target.userUUID,displayName:target.displayName,roleCode:target.roleCode,previousStatus:target.accountStatus,accountStatus:nextStatus,verificationStatus:target.verificationStatus,changedAt:new Date(changedAt).toISOString()};
 });
 await AuditService.logUserActivity(result.administratorUUID,'account-status-change',{userUUID:result.userUUID,previousStatus:result.previousStatus,newStatus:result.accountStatus});
 return result;
};
