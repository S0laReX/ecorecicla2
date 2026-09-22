'use client';
import {useState,type ReactNode} from 'react';import Link from 'next/link';import {useRouter,usePathname} from 'next/navigation';
import {useAuth} from '../../../features/auth/hooks/useAuth';import {homeFor} from '../../../features/auth/utils/redirect';
import {Button} from '../atoms/Button';import {Alert} from '../molecules/Alert';
export function AppShell({children}:{children:ReactNode}){
 const {user,status,logout}=useAuth();const router=useRouter();const pathname=usePathname();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const links=user?[{href:homeFor(user),label:'Mi inicio'},...(user.roleCode!=='ADMIN'?[{href:'/publicaciones',label:'Mis publicaciones'},{href:'/publicaciones/nueva',label:'Publicar material'}]:[])]:[{href:'/login',label:'Iniciar sesión'},{href:'/registro',label:'Crear cuenta'}];
 return <><a className="skip-link" href="#main">Saltar al contenido</a><header className="site-header"><div className="header-inner"><Link className="brand" href="/" aria-label="EcoRecicla, inicio"><span className="brand-mark">♻</span>Eco<span>Recicla</span></Link>
 <nav aria-label="Navegación principal">{status!=='loading'&&links.map(link=><Link key={link.href} href={link.href} aria-current={pathname===link.href?'page':undefined}>{link.label}</Link>)}</nav>
 {user&&<Button className="button-quiet" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await logout();router.replace('/login');}catch{setError('No se pudo cerrar la sesión en el servidor. Vuelve a intentarlo.');}finally{setBusy(false);}}}>{busy?'Saliendo…':'Cerrar sesión'}</Button>}</div></header>
 <main id="main">{error&&<Alert isError>{error}</Alert>}{children}</main><footer className="site-footer"><span className="brand">♻ EcoRecicla</span><span>Menos residuos. Más posibilidades.</span><small>Una comunidad que transforma lo que desecha.</small></footer></>;
}
