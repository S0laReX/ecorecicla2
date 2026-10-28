'use client';
import {useEffect,type ReactNode} from 'react';import {useRouter} from 'next/navigation';import {useAuth} from '../../hooks/useAuth';import {homeFor} from '../../utils/redirect';import type {User} from '../../types/auth';
export function RequireSession({children,roles,allowPending=true,allowRejected=false}:{children:ReactNode;roles?:User['roleCode'][];allowPending?:boolean;allowRejected?:boolean}){
 const {user,status}=useAuth();const router=useRouter();const denied=!!user&&((!allowRejected&&user.roleCode==='COMPANY'&&user.verificationStatus==='REJECTED')||(roles&&!roles.includes(user.roleCode))||(!allowPending&&user.roleCode==='COMPANY'&&user.verificationStatus==='PENDING'));
 useEffect(()=>{if(status==='guest')router.replace('/login');else if(denied&&user)router.replace(homeFor(user));},[status,denied,user,router]);
 if(status!=='authenticated'||!user||denied)return <p role="status">Comprobando tu acceso…</p>;return children;
}
