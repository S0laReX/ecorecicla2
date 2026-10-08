'use client';
import {useCallback,useEffect,useState} from 'react';
import {ApiRequestError} from '../../auth/services/sessionService';
import {cancelReservation,listAgenda} from '../services/collectionService';
import type {AgendaReservation} from '../types/collection';
type LoadState='loading'|'ready'|'error';
export function useAgenda(){
 const [items,setItems]=useState<AgendaReservation[]>([]);const [total,setTotal]=useState(0);const [page,setPage]=useState(1);const [limit,setLimit]=useState(6);
 const [status,setStatus]=useState<LoadState>('loading');const [error,setError]=useState('');const [cancellingUUID,setCancellingUUID]=useState<string|null>(null);
 const refresh=useCallback(async(signal?:AbortSignal)=>{
  setStatus('loading');setError('');
  try{const result=await listAgenda(page,signal);if(signal?.aborted)return;setItems(result.reservations);setTotal(result.meta.total);setLimit(result.meta.limit);setStatus('ready');}
  catch(cause){if(signal?.aborted)return;setItems([]);setTotal(0);setStatus('error');setError(cause instanceof ApiRequestError?cause.message:'No se pudo cargar la agenda. Intenta nuevamente.');}
 },[page]);
 useEffect(()=>{const controller=new AbortController();void refresh(controller.signal);const onFocus=()=>void refresh();window.addEventListener('focus',onFocus);return()=>{controller.abort();window.removeEventListener('focus',onFocus);};},[refresh]);
 const cancel=useCallback(async(reservationUUID:string)=>{
  setCancellingUUID(reservationUUID);setError('');
  try{await cancelReservation(reservationUUID);const nextTotal=Math.max(0,total-1);const lastPage=Math.max(1,Math.ceil(nextTotal/limit));if(page>lastPage)setPage(lastPage);else await refresh();return true;}
  catch(cause){setError(cause instanceof ApiRequestError?cause.message:'No se pudo cancelar la reserva. Actualiza la agenda e inténtalo nuevamente.');return false;}
  finally{setCancellingUUID(null);}
 },[limit,page,refresh,total]);
 return {items,total,page,limit,status,error,cancellingUUID,setPage,refresh,cancel};
}
