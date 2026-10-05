'use client';
import Link from 'next/link';import {useRouter} from 'next/navigation';import {usePublication} from '../hooks/usePublication';import {deletePublication} from '../services/publicationService';
import {RequireSession} from '../../auth/components/templates/RequireSession';import {PublicationCard} from '../components/organisms/PublicationCard';import {Alert} from '../../../shared/components/molecules/Alert';
function Detail({uuid}:{uuid:string}){const {publication,loading,error,reload}=usePublication(uuid);const router=useRouter();
 return <section><Link className="text-link" href="/publicaciones">← Mis publicaciones</Link><h1>Detalle del material</h1>{loading?<p role="status">Cargando publicación…</p>:error?<Alert isError>{error}</Alert>:publication&&<div style={{maxWidth:640}}><PublicationCard publication={publication} isOwner onEdit={id=>router.push(`/publicaciones/${id}/editar`)} onDelete={async id=>{try{await deletePublication(id);router.replace('/publicaciones');}catch(cause){await reload();throw cause;}}}/></div>}</section>;
}
export function PublicationDetailPage({uuid}:{uuid:string}){return <RequireSession roles={['USER','COMPANY']}><Detail uuid={uuid}/></RequireSession>;}
