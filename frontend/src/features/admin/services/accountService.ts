import {authenticatedRequest} from '../../auth/services/sessionService';
import {accountStatusResponseSchema,managedAccountsResponseSchema} from '../schemas/accountSchema';
import type {AccountStatusFilter} from '../types/managedAccount';
export async function fetchManagedAccounts(page:number,search:string,status:AccountStatusFilter){
 const params=new URLSearchParams({page:String(page),limit:'10',search,status});
 const response=managedAccountsResponseSchema.parse(await authenticatedRequest(`/admin/accounts?${params.toString()}`,{},true));
 return {accounts:response.data,meta:response.meta};
}
export async function updateManagedAccountStatus(userUUID:string,status:'ACTIVE'|'SUSPENDED'){
 return accountStatusResponseSchema.parse(await authenticatedRequest(`/admin/accounts/${encodeURIComponent(userUUID)}/status`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})}));
}
