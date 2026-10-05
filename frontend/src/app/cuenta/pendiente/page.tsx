'use client';
import Link from 'next/link';
import {RequireSession} from '../../../features/auth/components/templates/RequireSession';
import {useAuth} from '../../../features/auth/hooks/useAuth';
import {DesignIcon} from '../../../shared/components/atoms/DesignIcon';
export default function Page(){const {user}=useAuth();return <RequireSession roles={['COMPANY']}><section className="pending-page"><div className="pending-symbol"><DesignIcon name="hourglass"/></div><h1>¡Solicitud Enviada!</h1><span className="badge badge-warning"><DesignIcon name="info"/>Estado: Pendiente de Aprobación</span><p>Tu solicitud está siendo revisada por nuestro equipo. El acceso general se habilitará cuando tu empresa esté verificada.</p><div className="panel pending-summary"><span className="eyebrow">EMPRESA</span><p>{user?.displayName}</p></div><div className="panel"><h2>Mientras tanto, puedes reciclar.</h2><p>Publica material propio y gestiona tus avisos.</p><Link className="button button-amber" href="/publicaciones/nueva">Publicar material</Link><Link className="button button-secondary" href="/publicaciones">Mis publicaciones</Link></div></section></RequireSession>;}
