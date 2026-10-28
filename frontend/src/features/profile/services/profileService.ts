import {authenticatedRequest} from '../../auth/services/sessionService';
import {profileResponseSchema,profileSchema,historyResponseSchema,type ProfileInput,type HistoryStatus} from '../schemas/profileSchema';
export async function fetchProfile(){return profileResponseSchema.parse(await authenticatedRequest('/profile/me'));}
export async function updateProfile(input:ProfileInput){return profileSchema.parse(await authenticatedRequest('/profile/me',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}));}
export async function fetchHistory(status:HistoryStatus|'ALL',page:number){return historyResponseSchema.parse(await authenticatedRequest(`/profile/me/history?${new URLSearchParams({status,page:String(page),limit:'10'})}`,{},true));}
