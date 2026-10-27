'use client';
import {useCallback,useEffect,useState} from 'react';
import {ApiRequestError} from '../../auth/services/sessionService';
import {listPendingRatings,readMyProfileRating,submitRating} from '../services/ratingService';
import type {PendingRating,ProfileRating} from '../types/rating';
export function useRatings(){
 const [items,setItems]=useState<PendingRating[]>([]);const [profile,setProfile]=useState<ProfileRating|null>(null);const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');const [error,setError]=useState('');const [submitting,setSubmitting]=useState(false);
 const refresh=useCallback(async()=>{setStatus('loading');setError('');try{const [pending,summary]=await Promise.all([listPendingRatings(),readMyProfileRating()]);setItems(pending.items);setProfile(summary);setStatus('ready');}catch(cause){setError(cause instanceof ApiRequestError?cause.message:'No se pudieron cargar las calificaciones.');setStatus('error');}},[]);
 useEffect(()=>{void refresh();const focus=()=>{if(document.visibilityState==='visible')void refresh();};const timer=setInterval(focus,15000);window.addEventListener('focus',focus);return()=>{clearInterval(timer);window.removeEventListener('focus',focus);};},[refresh]);
 const rate=useCallback(async(reservationUUID:string,score:number)=>{setSubmitting(true);setError('');try{await submitRating(reservationUUID,score);await refresh();return true;}catch(cause){setError(cause instanceof ApiRequestError?cause.message:'No se pudo guardar la calificación. Intenta nuevamente.');return false;}finally{setSubmitting(false);}},[refresh]);
 return {items,profile,status,error,submitting,refresh,rate};
}
