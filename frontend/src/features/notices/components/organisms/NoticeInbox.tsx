'use client';
import {useAuth} from '../../../auth/hooks/useAuth';
import {useNotices} from '../../hooks/useNotices';
import {NoticeCard} from '../molecules/NoticeCard';
import {Button} from '../../../../shared/components/atoms/Button';
import {Alert} from '../../../../shared/components/molecules/Alert';
import type {NoticeFilter} from '../../schemas/noticeSchema';
export function NoticeInbox(){
 const state=useNotices();const {user}=useAuth();const restricted=user?.verificationStatus==='REJECTED';
 return <section className="notices-page"><header><p className="eyebrow">TU ACTIVIDAD</p><h1>Mis avisos</h1><p>Entérate de tus recolecciones y de las novedades de tu cuenta.</p></header>{restricted&&<Alert>Tu solicitud empresarial fue rechazada. Puedes consultar el motivo en tus avisos.</Alert>}
 <div className="notice-toolbar"><label htmlFor="notice-filter">Mostrar <select id="notice-filter" value={state.filter} onChange={event=>state.changeFilter(event.target.value as NoticeFilter)}><option value="ALL">Todos los avisos</option><option value="UNREAD">No leídos</option><option value="READ">Leídos</option></select></label><Button className="button-secondary" disabled={state.loading} onClick={state.reload}>Actualizar</Button></div>
 {state.actionError&&<Alert isError>{state.actionError}</Alert>}{state.loading?<p role="status">Cargando avisos…</p>:state.error?<><Alert isError>{state.error}</Alert><Button onClick={state.reload}>Reintentar</Button></>:state.data&&<>{state.data.data.length===0?<p className="notices-empty" role="status">{state.filter==='UNREAD'?'Estás al día. No tienes avisos sin leer.':'No hay avisos para mostrar.'}</p>:<ul className="notice-list">{state.data.data.map(notice=><li key={notice.noticeUUID}><NoticeCard notice={notice} restricted={restricted} busy={state.busy!==null} onRead={()=>void state.markRead(notice.noticeUUID)}/></li>)}</ul>}{state.data.meta.total>10&&<nav className="profile-pagination" aria-label="Páginas de avisos"><Button disabled={state.page===1||!!state.busy} onClick={()=>state.changePage(state.page-1)}>Anterior</Button><span>Página {state.page} de {Math.ceil(state.data.meta.total/10)}</span><Button disabled={state.page*10>=state.data.meta.total||!!state.busy} onClick={()=>state.changePage(state.page+1)}>Siguiente</Button></nav>}</>}
 </section>;
}
