'use client';
import {useEffect,useState} from 'react';
import {fetchMaterialPoints} from '../services/materialPointService';
import type {MaterialPoint} from '../schemas/materialPointSchema';
export function useMaterialPoints(){
 const [items,setItems]=useState<MaterialPoint[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError('');
  fetchMaterialPoints().then(data=>{if(active)setItems(data);}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'No se pudieron cargar los puntos.');}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[attempt]);
 return {items,loading,error,retry:()=>setAttempt(value=>value+1)};
}
