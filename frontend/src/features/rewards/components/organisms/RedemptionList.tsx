import {Button} from '../../../../shared/components/atoms/Button';
import type {Redemption} from '../../schemas/rewardSchema';
const date=new Intl.DateTimeFormat('es-BO',{dateStyle:'medium',timeStyle:'short',timeZone:'America/La_Paz'});
const number=new Intl.NumberFormat('es-BO');
export function RedemptionList({items,admin=false,onDeliver,busy=false}:{items:Redemption[];admin?:boolean;onDeliver?:(item:Redemption)=>void;busy?:boolean}){
 if(!items.length)return <div className="panel empty-state"><h3>{admin?'No hay canjes en este estado':'Todavía no hay canjes en este estado'}</h3><p>{admin?'Los premios canjeados por usuarios aparecerán aquí.':'Cuando canjees un premio podrás consultar aquí su código y entrega.'}</p></div>;
 return <ul className="redemption-list">{items.map(item=><li key={item.redemptionUUID} className="panel redemption-card"><div className="reward-card-heading"><h3>{item.rewardName}</h3><span className={`badge ${item.deliveredAt?'':'badge-warning'}`}>{item.deliveredAt?'Entregado':'Pendiente de entrega'}</span></div>
 {admin&&<p><strong>{item.userName}</strong><br/>{item.userEmail}</p>}
 <p>{number.format(item.pointsCost)} puntos · <time dateTime={item.createdAt}>{date.format(new Date(item.createdAt))}</time></p><p className="redemption-code">Código de canje: <code>{item.redemptionUUID}</code></p>
 {item.deliveredAt?<p className="muted">Entregado el {date.format(new Date(item.deliveredAt))}.</p>:admin?<Button disabled={busy} onClick={()=>onDeliver?.(item)}>Registrar entrega</Button>:<p className="muted">Presenta este código al administrador para recibir tu premio.</p>}
 </li>)}</ul>;
}
