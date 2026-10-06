'use client';
import {useCallback,useEffect,useState} from 'react';
import {fetchPendingCompanyApplications,submitCompanyDecision} from '../services/companyApplicationService';
import type {CompanyApplication,CompanyApplicationPage} from '../types/companyApplication';
export function useCompanyApplications(){
 const [result,setResult]=useState<CompanyApplicationPage|null>(null);
 const [selected,setSelected]=useState<CompanyApplication|null>(null);
 const [page,setPage]=useState(1);const [searchInput,setSearchInput]=useState('');const [search,setSearch]=useState('');
 const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
 useEffect(()=>{const timer=window.setTimeout(()=>{setSearch(searchInput.trim());setPage(1);},250);return()=>window.clearTimeout(timer);},[searchInput]);
 const reload=useCallback(async()=>{
  setLoading(true);setError('');
  try{const next=await fetchPendingCompanyApplications(page,search);setResult(next);
   setSelected(current=>current&&!next.companies.some(company=>company.companyUUID===current.companyUUID)?null:current);
  }catch(cause){setError(cause instanceof Error?cause.message:'No se pudieron cargar las solicitudes.');}
  finally{setLoading(false);}
 },[page,search]);
 useEffect(()=>{void reload();},[reload]);
 const decide=async(company:CompanyApplication,decision:'APPROVED'|'REJECTED',reason?:string)=>{
  setSaving(true);setError('');setNotice('');
  try{await submitCompanyDecision(company.companyUUID,decision,reason);setSelected(null);setNotice(decision==='APPROVED'?`${company.companyName} fue aprobada.`:`La solicitud de ${company.companyName} fue rechazada.`);await reload();}
  catch(cause){setError(cause instanceof Error?cause.message:'No se pudo registrar la decisión.');throw cause;}
  finally{setSaving(false);}
 };
 return {companies:result?.companies||[],meta:result?.meta||{total:0,page,limit:10},selected,setSelected,page,setPage,searchInput,setSearchInput,loading,saving,error,notice,setNotice,setError,reload,decide};
}
