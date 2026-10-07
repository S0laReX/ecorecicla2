import {sessionSchema,userSchema,type Session,type User} from '../types/auth';
import {STORAGE_KEYS} from '../constants/storageKeys';
import {ApiRequestError,decodeApiResponse as decode,fetchApi} from '../../../shared/services/apiResponse';
export {ApiRequestError} from '../../../shared/services/apiResponse';
export function clearSession(){for(const key of Object.values(STORAGE_KEYS))localStorage.removeItem(key);window.dispatchEvent(new Event('ecorecicla-session-ended'));}
function saveSession(session:Session){
 localStorage.setItem(STORAGE_KEYS.access,session.tokens.accessToken);localStorage.setItem(STORAGE_KEYS.refresh,session.tokens.refreshToken);
 localStorage.setItem(STORAGE_KEYS.userUUID,session.user.userUUID);localStorage.setItem(STORAGE_KEYS.activeProfile,session.user.roleCode);
}
export async function publicRequest(path:string,body:unknown):Promise<unknown>{return decode(await fetchApi(`/api/auth/${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'}));}
export async function login(email:string,password:string):Promise<User>{const session=sessionSchema.parse(await publicRequest('login',{email,password}));saveSession(session);return session.user;}
let refreshing:Promise<void>|null=null;
async function refreshSession(previousAccess:string|null){
 if(refreshing)return refreshing;
 const perform=async()=>{
  // Another tab may have already rotated this refresh token while waiting for Web Locks.
  if(localStorage.getItem(STORAGE_KEYS.access)!==previousAccess&&localStorage.getItem(STORAGE_KEYS.access))return;
  const refreshToken=localStorage.getItem(STORAGE_KEYS.refresh);const userUUID=localStorage.getItem(STORAGE_KEYS.userUUID);
  if(!refreshToken||!userUUID)throw new ApiRequestError(401,'SESSION_INVALID','Inicia sesión nuevamente.');
  const session=sessionSchema.parse(await publicRequest('refresh',{refreshToken,userUUID}));saveSession(session);
 };
 refreshing=(async()=>{if(navigator.locks)await navigator.locks.request('ecorecicla-refresh',perform);else await perform();})().finally(()=>{refreshing=null;});
 return refreshing;
}
export async function authenticatedRequest(path:string,init:RequestInit={},envelope=false):Promise<unknown>{
 const token=localStorage.getItem(STORAGE_KEYS.access);
 if(!token)throw new ApiRequestError(401,'AUTH_REQUIRED','Inicia sesión para continuar.');
 const send=()=>fetchApi(`/api${path}`,{...init,headers:{...Object.fromEntries(new Headers(init.headers).entries()),Authorization:`Bearer ${localStorage.getItem(STORAGE_KEYS.access)}`},cache:'no-store'});
 let response=await send();
 if(response.status===401){try{await refreshSession(token);response=await send();}catch(error){if(error instanceof ApiRequestError&&error.statusCode>=400&&error.statusCode<500)clearSession();throw error;}}
 try{return await decode(response,envelope);}catch(error){if(error instanceof ApiRequestError&&(error.statusCode===401||['ACCOUNT_SUSPENDED','COMPANY_REJECTED'].includes(error.errorCode)))clearSession();throw error;}
}
export async function restoreSession():Promise<User|null>{if(!localStorage.getItem(STORAGE_KEYS.access))return null;return userSchema.parse(await authenticatedRequest('/auth/me'));}
export async function logout():Promise<void>{await authenticatedRequest('/auth/logout',{method:'POST'});clearSession();}
