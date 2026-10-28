'use client';
import {useEffect,useState,type SetStateAction} from 'react';
import {fetchHistory} from '../services/profileService';
import type {History,HistoryStatus} from '../schemas/profileSchema';
export function useHistory(){
 const [filter,setFilter]=useState<HistoryStatus|'ALL'>('ALL');const [page,setPage]=useState(1);const [data,setData]=useState<History|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError('');setData(null);fetchHistory(filter,page).then(value=>{if(active)setData(value);}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'No se pudo cargar el historial.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[filter,page,attempt]);
 const beginLoad=()=>{setLoading(true);setData(null);setError('');};
 return {filter,changeFilter:(value:HistoryStatus|'ALL')=>{if(value===filter&&page===1)return;beginLoad();setFilter(value);setPage(1);},page,setPage:(value:SetStateAction<number>)=>{beginLoad();setPage(value);},data,loading,error,retry:()=>{beginLoad();setAttempt(value=>value+1);}};
}
