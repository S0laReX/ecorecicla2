'use client';
import {useEffect,useState} from 'react';
import {fetchNotices,markNoticeRead} from '../services/noticeService';
import type {Inbox,NoticeFilter} from '../schemas/noticeSchema';
export function useNotices(){
 const [filter,setFilter]=useState<NoticeFilter>('ALL');const [page,setPage]=useState(1);const [data,setData]=useState<Inbox|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [attempt,setAttempt]=useState(0);const [busy,setBusy]=useState<string|null>(null);const [actionError,setActionError]=useState('');
 useEffect(()=>{let active=true;setLoading(true);setError('');setData(null);fetchNotices(filter,page).then(value=>{if(active){if(page>1&&value.data.length===0)setPage(Math.max(1,Math.ceil(value.meta.total/value.meta.limit)));else setData(value);}}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'No se pudieron cargar los avisos.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[filter,page,attempt]);
 const reload=()=>{setLoading(true);setAttempt(value=>value+1);};
 return {filter,page,data,loading,error,busy,actionError,reload,changeFilter:(value:NoticeFilter)=>{setLoading(true);setFilter(value);setPage(1);setAttempt(value=>value+1);},changePage:(value:number)=>{setLoading(true);setPage(value);},markRead:async(uuid:string)=>{if(busy)return;setBusy(uuid);setActionError('');try{await markNoticeRead(uuid);reload();}catch(cause){setActionError(cause instanceof Error?cause.message:'No se pudo marcar el aviso.');}finally{setBusy(null);}}};
}
