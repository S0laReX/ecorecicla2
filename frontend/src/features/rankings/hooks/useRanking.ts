'use client';
import {useEffect,useState} from 'react';
import {fetchRanking} from '../services/rankingService';
import type {Ranking} from '../schemas/rankingSchema';
export function useRanking(){
 const [month,setMonth]=useState('');const [page,setPage]=useState(1);const [attempt,setAttempt]=useState(0);const [data,setData]=useState<Ranking|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 useEffect(()=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/La_Paz',year:'numeric',month:'2-digit'}).formatToParts(new Date());setMonth(`${parts.find(p=>p.type==='year')?.value}-${parts.find(p=>p.type==='month')?.value}`);},[]);
 useEffect(()=>{if(!month)return;let active=true;setLoading(true);setError('');fetchRanking(month,page).then(result=>{if(active)setData(result);}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'No se pudo cargar el ranking.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[month,page,attempt]);
 return {data,month,changeMonth:(value:string)=>{if(/^20\d{2}-(0[1-9]|1[0-2])$/.test(value)){setMonth(value);setPage(1);}},page,setPage,loading,error,reload:()=>setAttempt(value=>value+1)};
}
