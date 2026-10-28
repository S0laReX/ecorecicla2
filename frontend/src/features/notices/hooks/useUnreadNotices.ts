'use client';
import {useEffect,useState} from 'react';
import {useDispatch} from 'react-redux';
import {useAuth} from '../../auth/hooks/useAuth';
import {setUser} from '../../auth/store/authSlice';
import {fetchUnreadCount,noticesChanged} from '../services/noticeService';
export function useUnreadNotices(){
 const {user,status}=useAuth();const dispatch=useDispatch();const [count,setCount]=useState<number|null>(null);
 useEffect(()=>{
  let active=true,busy=false;setCount(null);
  if(!user||status!=='authenticated'||user.roleCode==='ADMIN')return;
  const refresh=async()=>{if(busy||document.hidden)return;busy=true;try{const result=await fetchUnreadCount();if(active){setCount(result.unreadCount);if(user.verificationStatus!==result.verificationStatus)dispatch(setUser({...user,verificationStatus:result.verificationStatus}));}}catch{if(active)setCount(null);}finally{busy=false;}};
  void refresh();const timer=window.setInterval(refresh,30000);
  window.addEventListener('focus',refresh);window.addEventListener(noticesChanged,refresh);document.addEventListener('visibilitychange',refresh);
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener(noticesChanged,refresh);document.removeEventListener('visibilitychange',refresh);};
 },[user,status,dispatch]);
 return count;
}
