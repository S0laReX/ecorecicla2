'use client';
import {useEffect,useRef,useId,type ReactNode} from 'react';
export function Modal({open,title,onClose,children}:{open:boolean;title:string;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);const titleId=useId();
 useEffect(()=>{if(open&&!ref.current?.open)ref.current?.showModal();else if(!open)ref.current?.close();},[open]);
 return <dialog ref={ref} aria-labelledby={titleId} onCancel={event=>{event.preventDefault();onClose();}} onClose={onClose}><h2 id={titleId}>{title}</h2>{children}</dialog>;
}
