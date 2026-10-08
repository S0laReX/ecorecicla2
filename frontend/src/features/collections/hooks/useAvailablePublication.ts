'use client';
import {useEffect,useState} from 'react';
import {useDispatch,useSelector} from 'react-redux';
import type {AppDispatch,RootState} from '../../../store/store';
import {fetchAvailableDetail} from '../store/collectionSlice';
export function useAvailablePublication(uuid:string){
 const dispatch=useDispatch<AppDispatch>();const state=useSelector((s:RootState)=>s.collections);const [revision,reload]=useState(0);
 useEffect(()=>{const task=dispatch(fetchAvailableDetail(uuid));return()=>task.abort();},[dispatch,uuid,revision]);
 return {publication:state.detail?.publicationUUID===uuid?state.detail:null,status:state.detailStatus,error:state.detailError,retry:()=>reload(v=>v+1)};
}
