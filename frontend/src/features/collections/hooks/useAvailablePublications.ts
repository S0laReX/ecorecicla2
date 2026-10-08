'use client';
import {useEffect,useState} from 'react';
import {useDispatch,useSelector} from 'react-redux';
import type {AppDispatch,RootState} from '../../../store/store';
import {fetchAvailable,setMaterialFilter,setCollectionPage} from '../store/collectionSlice';
import type {MaterialFilter} from '../types/collection';
export function useAvailablePublications(){
 const dispatch=useDispatch<AppDispatch>();const state=useSelector((s:RootState)=>s.collections);const [revision,reload]=useState(0);
 const {materialType,page}=state.filter;
 useEffect(()=>{const task=dispatch(fetchAvailable({materialType,page}));return()=>task.abort();},[dispatch,materialType,page,revision]);
 useEffect(()=>{const refresh=()=>{if(document.visibilityState==='visible')reload(v=>v+1);};window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};},[]);
 return {...state,refresh:()=>reload(v=>v+1),setMaterial:(value:MaterialFilter)=>dispatch(setMaterialFilter(value)),setPage:(value:number)=>dispatch(setCollectionPage(value))};
}
