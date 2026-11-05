'use client';
import {useState} from 'react';
import {useRewards} from '../../hooks/useRewards';
import {useRedemptions} from '../../hooks/useRedemptions';
import {redeemReward} from '../../services/rewardService';
import type {Reward,RedemptionStatus} from '../../schemas/rewardSchema';
import {RewardCard} from '../organisms/RewardCard';
import {RedemptionList} from '../organisms/RedemptionList';
import {Button} from '../../../../shared/components/atoms/Button';
import {Alert} from '../../../../shared/components/molecules/Alert';
import {Modal} from '../../../../shared/components/molecules/Modal';
import {Pagination} from '../../../../shared/components/molecules/Pagination';
const number=new Intl.NumberFormat('es-BO');
export function RewardsTemplate(){
 const catalog=useRewards();const history=useRedemptions();const [selected,setSelected]=useState<{reward:Reward;requestUUID:string}|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
 async function redeem(){if(!selected||busy)return;setBusy(true);setError('');try{
  const result=await redeemReward(selected.reward.rewardUUID,selected.requestUUID,selected.reward.pointsCost);
  catalog.setData(previous=>previous?{...previous,wallet:result.wallet}:previous);setSelected(null);setNotice(`Canje registrado: ${result.redemption.rewardName}. Código: ${result.redemption.redemptionUUID}.`);catalog.reload();history.changeStatus('ALL');history.reload();
 }catch(cause){setError(cause instanceof Error?cause.message:'No se pudo completar el canje.');catalog.reload();}finally{setBusy(false);}}
 const wallet=catalog.data?.wallet;
 return <section className="rewards-page"><header><p className="eyebrow">TU RECICLAJE TIENE RECOMPENSA</p><h1>Premios y puntos</h1><p>Elige un premio y usa los puntos obtenidos en tus recolecciones confirmadas.</p></header>
 {wallet&&<dl className="points-wallet"><div><dt>Puntos disponibles</dt><dd>{number.format(wallet.availablePoints)}</dd></div><div><dt>Puntos obtenidos</dt><dd>{number.format(wallet.earnedPoints)}</dd></div><div><dt>Puntos canjeados</dt><dd>{number.format(wallet.spentPoints)}</dd></div></dl>}
 {notice&&<Alert>{notice}</Alert>}
 <section aria-labelledby="catalog-title"><div className="page-title"><h2 id="catalog-title">Catálogo de premios</h2><Button className="button-secondary" disabled={catalog.loading||busy} onClick={catalog.reload}>Actualizar</Button></div>
 {catalog.loading?<p role="status">Cargando premios…</p>:catalog.error?<><Alert isError>{catalog.error}</Alert><Button onClick={catalog.reload}>Reintentar</Button></>:catalog.data&&<>{catalog.data.items.length?<div className="reward-grid">{catalog.data.items.map(reward=><RewardCard key={reward.rewardUUID} reward={reward} availablePoints={wallet?.availablePoints} onSelect={()=>{setSelected({reward,requestUUID:crypto.randomUUID()});setError('');setNotice('');}}/>)}</div>:<div className="panel empty-state"><h3>Próximamente, nuevos premios</h3><p>El administrador todavía no ha publicado premios.</p></div>}<Pagination page={catalog.page} total={catalog.data.meta.total} limit={catalog.data.meta.limit} onPage={catalog.setPage}/></>}
 </section>
 <section className="redemptions-section" aria-labelledby="history-title"><div className="page-title"><h2 id="history-title">Mis canjes</h2><label className="reward-status-filter">Estado<select value={history.status} onChange={e=>history.changeStatus(e.target.value as RedemptionStatus)}><option value="ALL">Todos</option><option value="PENDING">Pendientes</option><option value="DELIVERED">Entregados</option></select></label></div>
 {history.loading?<p role="status">Cargando canjes…</p>:history.error?<><Alert isError>{history.error}</Alert><Button onClick={history.reload}>Reintentar</Button></>:history.data&&<><RedemptionList items={history.data.items}/><Pagination page={history.page} total={history.data.meta.total} limit={history.data.meta.limit} onPage={history.setPage}/></>}
 </section>
 <Modal open={!!selected} title="Confirmar canje" onClose={()=>{if(!busy)setSelected(null);}}>{selected&&<><p>Vas a canjear <strong>{selected.reward.name}</strong> por <strong>{number.format(selected.reward.pointsCost)} puntos</strong>.</p><p>Se descontarán los puntos y se reservará una unidad. Después podrás presentar tu código al administrador para recibir el premio.</p>{error&&<Alert isError>{error} Puedes reintentar esta misma solicitud de forma segura.</Alert>}<div className="actions"><Button className="button-secondary" disabled={busy} onClick={()=>setSelected(null)}>Cancelar</Button><Button disabled={busy} onClick={()=>void redeem()}>{busy?'Canjeando…':'Confirmar canje'}</Button></div></>}</Modal>
 </section>;
}
