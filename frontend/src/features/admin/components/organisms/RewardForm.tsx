'use client';
import {useState} from 'react';
import {rewardInputSchema,type Reward} from '../../../rewards/schemas/rewardSchema';
import {saveReward} from '../../../rewards/services/rewardService';
import {Button} from '../../../../shared/components/atoms/Button';
import {Input} from '../../../../shared/components/atoms/Input';
import {FormField} from '../../../../shared/components/molecules/FormField';
import {Alert} from '../../../../shared/components/molecules/Alert';
export function RewardForm({initial,onSaved,onCancel,onBusy}:{initial?:Reward;onSaved:()=>void;onCancel:()=>void;onBusy:(busy:boolean)=>void}){
 const [name,setName]=useState(initial?.name||'');const [description,setDescription]=useState(initial?.description||'');const [cost,setCost]=useState(String(initial?.pointsCost??10));const [stock,setStock]=useState(String(initial?.stock??0));const [isActive,setActive]=useState(initial?.isActive??true);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(busy)return;setError('');
  const parsed=rewardInputSchema.safeParse({name,description,pointsCost:Number(cost),stock:Number(stock),isActive});
  if(!/^\d+$/.test(cost)||!/^\d+$/.test(stock)||!parsed.success){setError('Escribe un nombre de 2 a 120 caracteres, costo de 1 a 1 000 000 y existencias de 0 a 1 000 000, sin decimales. La descripción admite hasta 1000 caracteres.');return;}
  setBusy(true);onBusy(true);try{await saveReward(parsed.data,initial);onSaved();}catch(cause){setError(cause instanceof Error?cause.message:'No se pudo guardar el premio.');}finally{setBusy(false);onBusy(false);}
 }
 return <form className="reward-form" onSubmit={submit}><FormField id="reward-name" label="Nombre del producto"><Input id="reward-name" value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={120} required disabled={busy}/></FormField><FormField id="reward-description" label="Descripción y condiciones de entrega"><textarea id="reward-description" rows={3} value={description} maxLength={1000} onChange={e=>setDescription(e.target.value)} disabled={busy}/></FormField><div className="material-point-fields"><FormField id="reward-cost" label="Puntos por premio"><Input id="reward-cost" type="number" inputMode="numeric" min={1} max={1000000} step={1} required value={cost} onChange={e=>setCost(e.target.value)} disabled={busy}/></FormField><FormField id="reward-stock" label="Unidades disponibles"><Input id="reward-stock" type="number" inputMode="numeric" min={0} max={1000000} step={1} required value={stock} onChange={e=>setStock(e.target.value)} disabled={busy}/></FormField></div><label className="reward-active"><input type="checkbox" checked={isActive} onChange={e=>setActive(e.target.checked)} disabled={busy}/>Visible en el catálogo</label><p className="muted">Oculta un premio para detener nuevos canjes. Los canjes anteriores conservan su nombre y costo originales.</p>{error&&<Alert isError>{error}</Alert>}<div className="actions"><Button className="button-secondary" onClick={onCancel} disabled={busy}>Cancelar</Button><Button type="submit" disabled={busy}>{busy?'Guardando…':'Guardar premio'}</Button></div></form>;
}
