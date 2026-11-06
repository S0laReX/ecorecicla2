'use client';
import {useCallback,useEffect,useState} from 'react';
import {fetchRedemptions} from '../services/rewardService';
import type {RedemptionHistory,RedemptionStatus} from '../schemas/rewardSchema';
export function useRedemptions(admin=false){
 const [data,setData]=useState<RedemptionHistory|null>(null);const [page,setPage]=useState(1);const [status,setStatus]=useState<RedemptionStatus>(admin?'PENDING':'ALL');const [attempt,setAttempt]=useState(0);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 const reload=useCallback(()=>setAttempt(value=>value+1),[]);
 useEffect(()=>{let active=true;setLoading(true);setError('');fetchRedemptions(page,status,admin).then(result=>{if(active)setData(result);}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'No se pudieron cargar los canjes.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[page,status,admin,attempt]);
 return {data,page,setPage,status,changeStatus:(value:RedemptionStatus)=>{setStatus(value);setPage(1);},loading,error,reload};
}
