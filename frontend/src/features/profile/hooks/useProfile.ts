'use client';
import {useEffect,useState} from 'react';
import {fetchProfile} from '../services/profileService';
export function useProfile(){
 const [data,setData]=useState<Awaited<ReturnType<typeof fetchProfile>>|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError('');fetchProfile().then(value=>{if(active)setData(value);}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'No se pudo cargar el perfil.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[attempt]);
 return {data,setData,loading,error,retry:()=>setAttempt(value=>value+1)};
}
