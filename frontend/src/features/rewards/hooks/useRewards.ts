'use client';
import {useCallback,useEffect,useState} from 'react';
import {fetchRewards} from '../services/rewardService';
import type {Catalog} from '../schemas/rewardSchema';
export function useRewards(admin=false){
 const [data,setData]=useState<Catalog|null>(null);const [page,setPage]=useState(1);const [attempt,setAttempt]=useState(0);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 const reload=useCallback(()=>setAttempt(value=>value+1),[]);
 useEffect(()=>{let active=true;setLoading(true);setError('');fetchRewards(page,admin).then(result=>{if(active)setData(result);}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'No se pudo cargar el catálogo.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[page,admin,attempt]);
 return {data,setData,page,setPage,loading,error,reload};
}
