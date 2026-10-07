'use client';
import {useEffect,useState,useCallback} from 'react';import {useDispatch,useSelector} from 'react-redux';
import type {RootState,AppDispatch} from '../../../store/store';import {fetchMyPublications,removePublication} from '../store/publicationSlice';import {deletePublication} from '../services/publicationService';
export function useMyPublications(){
 const dispatch=useDispatch<AppDispatch>();const {user}=useSelector((state:RootState)=>state.auth);const state=useSelector((root:RootState)=>root.publications);const [page,setPage]=useState(1);
 const refresh=useCallback(()=>{if(user)return dispatch(fetchMyPublications(page));},[dispatch,page,user]);
 useEffect(()=>{const promise=refresh();const focus=()=>{refresh();};window.addEventListener('focus',focus);return()=>{promise?.abort();window.removeEventListener('focus',focus);};},[refresh]);
 const remove=async(uuid:string)=>{await deletePublication(uuid);dispatch(removePublication(uuid));if(state.items.length===1&&page>1)setPage(page-1);else await refresh();};
 return {...state,page,setPage,refresh,remove};
}
