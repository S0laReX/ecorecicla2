'use client';
import Link from 'next/link';import {useRouter} from 'next/navigation';import {useMyPublications} from '../hooks/useMyPublications';
import {RequireSession} from '../../auth/components/templates/RequireSession';import {PublicationCard} from '../components/organisms/PublicationCard';import {Button} from '../../../shared/components/atoms/Button';import {Alert} from '../../../shared/components/molecules/Alert';
function MyPublications(){const {items,listStatus,listError,meta,page,setPage,refresh,remove}=useMyPublications();const router=useRouter();
 return <section><div className="page-title"><div><p className="eyebrow">TUS MATERIALES, AL DÍA</p><h1>Mis publicaciones</h1></div><Link className="button" href="/publicaciones/nueva">＋ Publicar material</Link></div>
 <p className="muted">Puedes editar o eliminar tus materiales mientras estén disponibles.</p><Button className="button-quiet" disabled={listStatus==='pending'} onClick={()=>refresh()}>Actualizar listado</Button>
 {listError&&<Alert isError>{listError}</Alert>}{listStatus==='pending'&&<p role="status">Actualizando publicaciones…</p>}
 {listStatus==='succeeded'&&!items.length?<div className="panel empty-state"><h2>Aquí empieza el cambio.</h2><p>Aún no hay publicaciones en esta página.</p><Link className="button" href="/publicaciones/nueva">Publicar mi primer material</Link></div>:<div className="publication-grid" aria-busy={listStatus==='pending'}>{items.map(p=><PublicationCard key={p.publicationUUID} publication={p} isOwner onView={id=>router.push(`/publicaciones/${id}`)} onEdit={id=>router.push(`/publicaciones/${id}/editar`)} onDelete={remove}/>)}</div>}
 <div className="pagination"><Button className="button-secondary" disabled={page<=1||listStatus==='pending'} onClick={()=>setPage(page-1)}>Anterior</Button><span>Página {page} de {Math.max(1,Math.ceil(meta.total/meta.limit))}</span><Button className="button-secondary" disabled={page*meta.limit>=meta.total||listStatus==='pending'} onClick={()=>setPage(page+1)}>Siguiente</Button></div></section>;
}
export function MyPublicationsPage(){return <RequireSession roles={['USER','COMPANY']}><MyPublications/></RequireSession>;}
