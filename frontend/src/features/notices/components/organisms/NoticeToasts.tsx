'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useAuth} from '../../../auth/hooks/useAuth';
import {fetchNotices,noticesChanged} from '../../services/noticeService';
import type {Notice} from '../../schemas/noticeSchema';
import {DesignIcon} from '../../../../shared/components/atoms/DesignIcon';

/** New notices only: opening a session does not replay the existing inbox. */
export function NoticeToasts(){
 const {user,status}=useAuth();
 const recipient=status==='authenticated'&&user&&user.roleCode!=='ADMIN'?user.userUUID:null;
 return recipient?<RecipientToasts key={recipient}/>:null;
}
function RecipientToasts(){
 const [queue,setQueue]=useState<Notice[]>([]);
 useEffect(()=>{
  let active=true,busy=false,initialized=false;let latest:string|null=null;
  const refresh=async()=>{
   if(busy||document.hidden)return;busy=true;
   try{
    const first=await fetchNotices('ALL',1);
    if(!active)return;
    const newest=first.data[0]?.noticeUUID??null;
    if(!initialized){latest=newest;initialized=true;return;}
    const incoming:Notice[]=[];let result=first,page=1,found=false;
    while(active){
     for(const notice of result.data){if(notice.noticeUUID===latest){found=true;break;}if(!notice.readAt)incoming.push(notice);}
     if(found||page*result.meta.limit>=result.meta.total)break;
     result=await fetchNotices('ALL',++page);
    }
    if(!active)return;
    latest=newest;
    if(incoming.length)setQueue(previous=>[...previous,...incoming.reverse().filter(notice=>!previous.some(item=>item.noticeUUID===notice.noticeUUID))]);
   }catch{/* Keep the cursor on failure so the next successful check recovers new notices. */}
   finally{busy=false;}
  };
  void refresh();const timer=window.setInterval(refresh,30000);
  window.addEventListener('focus',refresh);window.addEventListener(noticesChanged,refresh);document.addEventListener('visibilitychange',refresh);
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener(noticesChanged,refresh);document.removeEventListener('visibilitychange',refresh);};
 },[]);
 const dismiss=(uuid:string)=>setQueue(previous=>previous.filter(notice=>notice.noticeUUID!==uuid));
 return <aside className="notice-toasts" aria-label="Avisos nuevos" aria-live="polite" aria-relevant="additions">{queue.slice(0,3).map(notice=><article className="notice-toast" key={notice.noticeUUID}><DesignIcon name="leaf-dashboard"/><div><strong>{notice.title}</strong><p>{notice.body}</p><Link href="/avisos" onClick={()=>dismiss(notice.noticeUUID)}>Ver avisos</Link></div><button type="button" className="notice-toast-close" aria-label={`Cerrar notificación: ${notice.title}`} onClick={()=>dismiss(notice.noticeUUID)}>×</button></article>)}</aside>;
}
