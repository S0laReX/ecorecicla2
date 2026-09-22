import {sessionSchema,userSchema,type Session,type User} from '../types/auth';
import {STORAGE_KEYS} from '../constants/storageKeys';
import {z} from 'zod';
const errorSchema=z.object({success:z.literal(false),message:z.string(),errorCode:z.string(),statusCode:z.number()});
export class ApiRequestError extends Error{
 constructor(public readonly statusCode:number,public readonly errorCode:string,message:string){super(message);}
}
export function clearSession(){for(const key of Object.values(STORAGE_KEYS))localStorage.removeItem(key);window.dispatchEvent(new Event('ecorecicla-session-ended'));}
function saveSession(session:Session){
 localStorage.setItem(STORAGE_KEYS.access,session.tokens.accessToken);localStorage.setItem(STORAGE_KEYS.refresh,session.tokens.refreshToken);
 localStorage.setItem(STORAGE_KEYS.userUUID,session.user.userUUID);localStorage.setItem(STORAGE_KEYS.activeProfile,session.user.roleCode);
}
async function decode(response:Response,envelope=false):Promise<unknown>{
 let json:unknown;try{json=await response.json();}catch{throw new ApiRequestError(response.status,'INVALID_RESPONSE','No se pudo leer la respuesta del servidor.');}
 if(!response.ok){const parsed=errorSchema.safeParse(json);throw new ApiRequestError(response.status,parsed.success?parsed.data.errorCode:'HTTP_ERROR',parsed.success?parsed.data.message:'No se pudo completar la solicitud.');}
 const parsed=z.object({success:z.literal(true),data:z.unknown()}).parse(json);return envelope?json:parsed.data;
}
export async function publicRequest(path:string,body:unknown):Promise<unknown>{return decode(await fetch(`/api/auth/${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'}));}
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
 const send=()=>fetch(`/api${path}`,{...init,headers:{...Object.fromEntries(new Headers(init.headers).entries()),Authorization:`Bearer ${localStorage.getItem(STORAGE_KEYS.access)}`},cache:'no-store'});
 let response=await send();
 if(response.status===401){try{await refreshSession(token);response=await send();}catch(error){if(error instanceof ApiRequestError&&error.statusCode<500)clearSession();throw error;}}
 try{return await decode(response,envelope);}catch(error){if(error instanceof ApiRequestError&&(error.statusCode===401||['ACCOUNT_SUSPENDED','COMPANY_REJECTED'].includes(error.errorCode)))clearSession();throw error;}
}
export async function restoreSession():Promise<User|null>{if(!localStorage.getItem(STORAGE_KEYS.access))return null;return userSchema.parse(await authenticatedRequest('/auth/me'));}
export async function logout():Promise<void>{await authenticatedRequest('/auth/logout',{method:'POST'});clearSession();}
