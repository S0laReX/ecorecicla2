import {authenticatedBlobRequest,authenticatedRequest} from '../../auth/services/sessionService';
import {companyApplicationPageSchema,companyDecisionResponseSchema} from '../schemas/companyApplicationSchema';
import type {CompanyApplicationPage,CompanyDecision} from '../types/companyApplication';
export async function fetchPendingCompanyApplications(page:number,search:string):Promise<CompanyApplicationPage>{
 const params=new URLSearchParams({page:String(page),limit:'10',search});
 const response=await authenticatedRequest(`/admin/companies/pending?${params.toString()}`,{},true);
 const parsed=companyApplicationPageSchema.parse(response);
 return {companies:parsed.data,meta:parsed.meta};
}
export async function fetchCompanyVerificationDocument(companyUUID:string){
 return authenticatedBlobRequest(`/admin/companies/${encodeURIComponent(companyUUID)}/document`);
}
export async function submitCompanyDecision(companyUUID:string,decision:'APPROVED'|'REJECTED',reason?:string):Promise<CompanyDecision>{
 const body=decision==='REJECTED'?{decision,reason}:{decision};
 return companyDecisionResponseSchema.parse(await authenticatedRequest(`/admin/companies/${encodeURIComponent(companyUUID)}/decision`,{
  method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
 }));
}
