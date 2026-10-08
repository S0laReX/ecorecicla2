'use client';
import {useState,type ReactNode} from 'react';
import Link from 'next/link';
import {useRouter,usePathname} from 'next/navigation';
import {useAuth} from '../../../features/auth/hooks/useAuth';
import {homeFor} from '../../../features/auth/utils/redirect';
import {Button} from '../atoms/Button';
import {DesignIcon,type DesignIconName} from '../atoms/DesignIcon';
import {Alert} from '../molecules/Alert';
export function AppShell({children}:{children:ReactNode}) {
 const {user,status,logout}=useAuth();const router=useRouter();const pathname=usePathname();
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const authPage=['/login','/registro','/recuperar','/restablecer'].includes(pathname);
 const links:{href:string;label:string;icon:DesignIconName}[]=user?[
  {href:homeFor(user),label:'Inicio',icon:'home'},
  ...(user.roleCode==='COMPANY'&&user.verificationStatus==='APPROVED'?[{href:'/recolecciones',label:'Explorar',icon:'collection-explore' as const}]:[]),
  ...(user.roleCode!=='ADMIN'?[
   {href:'/publicaciones/nueva',label:'Publicar',icon:'plus' as const},
   {href:'/publicaciones',label:'Mis publicaciones',icon:'history' as const}]:[])
 ]:[];
 const isActive=(href:string)=>pathname===href||(href==='/recolecciones'&&pathname.startsWith('/recolecciones/'))||(href==='/publicaciones'&&pathname.startsWith('/publicaciones/')&&pathname!=='/publicaciones/nueva');
 return <div className={user&&!authPage?'app-frame signed-in':'app-frame'}>
  <a className="skip-link" href="#main">Saltar al contenido</a>
  {!authPage&&<header className="site-header"><div className="header-inner">
   <Link className="brand" href={user?homeFor(user):'/'} aria-label="EcoRecicla, inicio"><DesignIcon name="leaf-dashboard"/>EcoRecicla</Link>
   {user?<><nav className="desktop-nav" aria-label="Navegación principal">{links.map(link=><Link key={link.href} href={link.href} aria-current={isActive(link.href)?'page':undefined}>{link.label}</Link>)}</nav>
    <Button className="button-quiet logout-button" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await logout();router.replace('/login');}catch{setError('No se pudo cerrar la sesión en el servidor. Vuelve a intentarlo.');}finally{setBusy(false);}}}>{busy?'Saliendo…':'Cerrar sesión'}</Button></>:
    <nav aria-label="Navegación principal"><Link className="guest-register" href="/registro">Crear cuenta</Link><Link className="button button-mint" href="/login">Acceder</Link></nav>}
  </div></header>}
  <main id="main" className={authPage?'main-auth':pathname==='/'?'main-landing':''}>{error&&<Alert isError>{error}</Alert>}{children}</main>
  {!authPage&&!user&&<footer className="site-footer"><Link className="brand" href="/"><DesignIcon name="leaf-dashboard"/>EcoRecicla</Link><p>Juntos, cada acción cuenta.</p><small>Recicla hoy. Construye un mañana mejor.</small></footer>}
  {user&&!authPage&&status!=='loading'&&<nav className="bottom-nav" aria-label="Navegación móvil">{links.map(link=><Link key={link.href} href={link.href} aria-current={isActive(link.href)?'page':undefined}><span><DesignIcon name={link.icon}/></span>{link.label}</Link>)}</nav>}
 </div>;
}
