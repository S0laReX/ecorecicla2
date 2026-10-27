'use client';
import {useCallback,useEffect,useState} from 'react';
import {fetchManagedAccounts,updateManagedAccountStatus} from '../services/accountService';
import type {AccountStatusFilter,ManagedAccount} from '../types/managedAccount';
export function useManagedAccounts(){
 const [accounts,setAccounts]=useState<ManagedAccount[]>([]);const [total,setTotal]=useState(0);const [page,setPage]=useState(1);
 const [searchInput,setSearchInput]=useState('');const [search,setSearch]=useState('');const [status,setStatus]=useState<AccountStatusFilter>('ALL');
 const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
 useEffect(()=>{const timer=window.setTimeout(()=>{setSearch(searchInput.trim());setPage(1);},250);return()=>window.clearTimeout(timer);},[searchInput]);
 const reload=useCallback(async()=>{setLoading(true);setError('');try{const result=await fetchManagedAccounts(page,search,status);setAccounts(result.accounts);setTotal(result.meta.total);}catch(cause){setError(cause instanceof Error?cause.message:'No se pudieron cargar las cuentas.');}finally{setLoading(false);}},[page,search,status]);
 useEffect(()=>{void reload();},[reload]);
 const changeStatus=useCallback(async(account:ManagedAccount,nextStatus:'ACTIVE'|'SUSPENDED')=>{
  setSaving(true);setError('');setNotice('');
  try{const result=await updateManagedAccountStatus(account.userUUID,nextStatus);setNotice(result.message);await reload();}
  catch(cause){setError(cause instanceof Error?cause.message:'No se pudo actualizar el estado de la cuenta.');throw cause;}
  finally{setSaving(false);}
 },[reload]);
 return {accounts,total,page,setPage,searchInput,setSearchInput,status,setStatus,loading,saving,error,notice,setNotice,reload,changeStatus};
}
