'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ApiRequestError} from '../../auth/services/sessionService';
import {cancelReservation,confirmReservation,listAgenda} from '../services/collectionService';
import type {AgendaReservation,ConfirmationResult} from '../types/collection';
export function useAgenda(){
 const [items,setItems]=useState<AgendaReservation[]>([]);const [total,setTotal]=useState(0);const [page,setPage]=useState(1);const [limit,setLimit]=useState(6);
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');const [error,setError]=useState('');
 const [cancellingUUID,setCancellingUUID]=useState<string|null>(null);const [confirmingUUID,setConfirmingUUID]=useState<string|null>(null);
 const [confirmation,setConfirmation]=useState<ConfirmationResult|null>(null);
 const mutation=useRef(false);const currentRequest=useRef(0);const active=useRef(true);
 const refresh=useCallback(async(signal?:AbortSignal,silent=false)=>{
  const request=++currentRequest.current;if(!silent)setStatus('loading');
  try{const result=await listAgenda(page,signal);if(signal?.aborted||!active.current||request!==currentRequest.current)return;
   setItems(result.reservations);setTotal(result.meta.total);setLimit(result.meta.limit);setStatus('ready');
   if(page>1&&!result.reservations.length)setPage(Math.max(1,Math.ceil(result.meta.total/result.meta.limit)));
  }catch(cause){if(signal?.aborted||!active.current||request!==currentRequest.current)return;setItems([]);setTotal(0);setStatus('error');setError(cause instanceof ApiRequestError?cause.message:'No se pudo cargar la agenda. Intenta nuevamente.');}
 },[page]);
 useEffect(()=>{
  active.current=true;const controller=new AbortController();void refresh(controller.signal);
  const onFocus=()=>{if(!mutation.current&&document.visibilityState==='visible')void refresh(controller.signal,true);};
  const timer=setInterval(onFocus,15000);window.addEventListener('focus',onFocus);
  return()=>{active.current=false;currentRequest.current++;controller.abort();clearInterval(timer);window.removeEventListener('focus',onFocus);};
 },[refresh]);
 const act=useCallback(async(uuid:string,kind:'cancel'|'confirm')=>{
  if(mutation.current)return false;mutation.current=true;setError('');setConfirmation(null);
  if(kind==='cancel')setCancellingUUID(uuid);else setConfirmingUUID(uuid);
  let succeeded=false;let failure='';
  try{if(kind==='confirm'){const result=await confirmReservation(uuid);if(active.current)setConfirmation(result);}else await cancelReservation(uuid);succeeded=true;}
  catch(cause){failure=cause instanceof ApiRequestError?cause.message:'No se pudo completar la acción. Actualiza la agenda antes de volver a intentar.';}
  finally{
   if(active.current){await refresh(undefined,true);if(failure)setError(failure);setCancellingUUID(null);setConfirmingUUID(null);}
   mutation.current=false;
  }
  return succeeded;
 },[refresh]);
 return {items,total,page,limit,status,error,cancellingUUID,confirmingUUID,confirmation,setPage,refresh,
  cancel:(uuid:string)=>act(uuid,'cancel'),confirm:(uuid:string)=>act(uuid,'confirm')};
}
