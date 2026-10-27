'use client';
import Link from 'next/link';
import {RequireSession} from '../../auth/components/templates/RequireSession';
import {Alert} from '../../../shared/components/molecules/Alert';
import {Button} from '../../../shared/components/atoms/Button';
import {RatingSummary} from '../components/molecules/RatingSummary';
import {RatingsTemplate} from '../components/templates/RatingsTemplate';
import {useRatings} from '../hooks/useRatings';
function ProfileContent(){const {profile,status,error,refresh}=useRatings();return <RatingsTemplate><header className="ratings-heading"><p className="eyebrow">MI CUENTA</p><h1>Mi perfil</h1><p>Consulta la calificación que recibiste en recolecciones confirmadas.</p></header>{error&&<Alert isError>{error}</Alert>}{status==='loading'&&<p role="status">Cargando tu perfil…</p>}{status==='error'&&<Button onClick={()=>void refresh()}>Reintentar</Button>}{profile&&<RatingSummary average={profile.average} count={profile.count}/>}<Link className="button" href="/calificaciones">Ver calificaciones pendientes</Link></RatingsTemplate>;}
export function ProfileRatingPage(){return <RequireSession roles={['USER','COMPANY']} allowPending={false}><ProfileContent/></RequireSession>;}
