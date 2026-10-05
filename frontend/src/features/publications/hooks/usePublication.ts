'use client';
import {useCallback,useEffect,useRef,useState} from 'react';import {retrievePublication} from '../services/publicationService';import type {Publication} from '../types/publication';
export function usePublication(uuid:string){
 const [publication,setPublication]=useState<Publication|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const generation=useRef(0);
 const reload=useCallback(async()=>{const current=++generation.current;setLoading(true);setError('');try{const result=await retrievePublication(uuid);if(generation.current===current)setPublication(result);}catch(cause){if(generation.current===current){setError(cause instanceof Error?cause.message:'No se pudo cargar la publicación.');setPublication(null);}}finally{if(generation.current===current)setLoading(false);}},[uuid]);
 useEffect(()=>{void reload();return()=>{generation.current++;};},[reload]);
 return {publication,error,loading,reload};
}
