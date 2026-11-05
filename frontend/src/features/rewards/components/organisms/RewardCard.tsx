import {Button} from '../../../../shared/components/atoms/Button';
import {DesignIcon} from '../../../../shared/components/atoms/DesignIcon';
import type {Reward} from '../../schemas/rewardSchema';
const number=new Intl.NumberFormat('es-BO');
export function RewardCard({reward,availablePoints=0,admin=false,onSelect}:{reward:Reward;availablePoints?:number;admin?:boolean;onSelect:()=>void}){
 const missing=Math.max(0,reward.pointsCost-availablePoints);
 return <article className="panel reward-card"><div className="reward-card-heading"><span className="icon-circle"><DesignIcon name="step-reward"/></span><span className="badge">{!reward.isActive?'Oculto':reward.stock===0?'Agotado':`${number.format(reward.stock)} ${reward.stock===1?'disponible':'disponibles'}`}</span></div><h2>{reward.name}</h2><p className="reward-description">{reward.description||'Un premio por tu aporte al reciclaje.'}</p><p className="reward-cost">{number.format(reward.pointsCost)} <span>puntos</span></p>
 {!admin&&missing>0&&<p className="muted">Te faltan {number.format(missing)} puntos.</p>}
 <Button className={admin?'button-secondary':''} disabled={!admin&&(reward.stock===0||missing>0)} onClick={onSelect}>{admin?'Editar premio':reward.stock===0?'Agotado':'Canjear premio'}</Button></article>;
}
