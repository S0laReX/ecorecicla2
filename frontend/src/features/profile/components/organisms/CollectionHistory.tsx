'use client';
import {useHistory} from '../../hooks/useHistory';
import type {HistoryStatus} from '../../schemas/profileSchema';
import {HistoryCard,STATUS_LABELS} from '../molecules/HistoryCard';
import {Button} from '../../../../shared/components/atoms/Button';
import {Alert} from '../../../../shared/components/molecules/Alert';
import {FormField} from '../../../../shared/components/molecules/FormField';
export function CollectionHistory(){const state=useHistory();const pages=state.data?Math.max(1,Math.ceil(state.data.meta.total/state.data.meta.limit)):1;return <section className="profile-history" aria-labelledby="history-title">
 <div className="profile-section-heading"><div><h2 id="history-title">Historial de recolecciones</h2><p>Fecha acordada en Bolivia y puntos otorgados a tu cuenta.</p></div><FormField id="history-status" label="Filtrar por estado"><select id="history-status" value={state.filter} onChange={e=>state.changeFilter(e.target.value as HistoryStatus|'ALL')}><option value="ALL">Todos los estados</option>{Object.entries(STATUS_LABELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></FormField></div>
 {state.loading?<p role="status">Cargando historial…</p>:state.error?<><Alert isError>{state.error}</Alert><Button onClick={state.retry}>Reintentar historial</Button></>:state.data&&<>
  {state.data.data.length?<ul className="profile-history-list">{state.data.data.map(item=><HistoryCard key={item.reservationUUID} item={item}/>)}</ul>:<p className="panel" role="status">No hay recolecciones para este estado.</p>}
  <nav className="profile-pagination" aria-label="Paginación del historial"><Button className="button-secondary" disabled={state.page<=1} onClick={()=>state.setPage(value=>value-1)}>Anterior</Button><span aria-live="polite">Página {state.page} de {pages} · {state.data.meta.total} registros</span><Button className="button-secondary" disabled={state.page>=pages} onClick={()=>state.setPage(value=>value+1)}>Siguiente</Button></nav>
 </>}
</section>;}
