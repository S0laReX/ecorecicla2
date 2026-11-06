'use client';
import {useRanking} from '../../hooks/useRanking';
import {useAuth} from '../../../auth/hooks/useAuth';
import {Button} from '../../../../shared/components/atoms/Button';
import {DesignIcon} from '../../../../shared/components/atoms/DesignIcon';
import {Alert} from '../../../../shared/components/molecules/Alert';
import {Pagination} from '../../../../shared/components/molecules/Pagination';
const number=new Intl.NumberFormat('es-BO');
export function RankingTemplate(){
 const state=useRanking();const {user}=useAuth();const data=state.data;
 return <section className="ranking-page"><header><p className="eyebrow">EMPRESAS QUE HACEN LA DIFERENCIA</p><h1>Ranking mensual</h1><p>Compara los puntos obtenidos por las empresas en recolecciones confirmadas durante cada mes.</p></header><div className="ranking-toolbar"><label className="field" htmlFor="ranking-month">Mes del ranking<input id="ranking-month" type="month" min="2000-01" max="2099-12" value={state.month} onChange={e=>state.changeMonth(e.target.value)}/></label><Button className="button-secondary" disabled={state.loading} onClick={state.reload}>Actualizar</Button></div>
 <p className="muted">Cada mes se cuenta desde cero, según la hora de Bolivia (UTC−4). Se suman los puntos recibidos como publicador y recolector. Participan empresas aprobadas y activas; los empates comparten posición.</p>
 {state.loading?<p role="status">Cargando ranking…</p>:state.error?<><Alert isError>{state.error}</Alert><Button onClick={state.reload}>Reintentar</Button></>:data&&<>
 {user?.roleCode==='COMPANY'&&<div className="panel ranking-own"><span className="icon-circle"><DesignIcon name="company"/></span><div><h2>{data.ownEntry?`Tu empresa está en el puesto ${data.ownEntry.position}`:'Tu empresa aún no tiene puntos este mes'}</h2><p>{data.ownEntry?`${number.format(data.ownEntry.points)} puntos obtenidos en ${data.month}.`:'Confirma recolecciones para sumar puntos y aparecer en el ranking.'}</p></div></div>}
 {data.items.length?<><div className="ranking-table-wrap"><table className="ranking-table"><caption>Empresas con más puntos · {data.month}</caption><thead><tr><th scope="col">Puesto</th><th scope="col">Empresa</th><th scope="col">Puntos del mes</th></tr></thead><tbody>{data.items.map(entry=><tr key={entry.companyUUID} className={entry.companyUUID===user?.userUUID?'ranking-current':''}><td><strong>#{entry.position}</strong></td><th scope="row">{entry.companyName}{entry.companyUUID===user?.userUUID&&<span className="ranking-you">Tu empresa</span>}</th><td>{number.format(entry.points)}</td></tr>)}</tbody></table></div><Pagination page={state.page} total={data.meta.total} limit={data.meta.limit} onPage={state.setPage}/></>:<div className="panel empty-state"><h2>Sin puntos en este mes</h2><p>El ranking mostrará las empresas que obtengan puntos durante el mes seleccionado.</p></div>}
 </>}
 </section>;
}
