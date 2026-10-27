'use client';
import {useState} from 'react';
import {Button} from '../../../../shared/components/atoms/Button';
import {Input} from '../../../../shared/components/atoms/Input';
import {FormField} from '../../../../shared/components/molecules/FormField';
import {Alert} from '../../../../shared/components/molecules/Alert';
import {pointValuesSchema,type MaterialPoint} from '../../schemas/materialPointSchema';
import {saveMaterialPoints} from '../../services/materialPointService';
const labels={plastico:'Plástico',papel:'Papel',vidrio:'Vidrio',metal:'Metal',organico:'Orgánico'};
export function MaterialPointForm({initial}:{initial:MaterialPoint}){
 const [saved,setSaved]=useState(initial);const [publisher,setPublisher]=useState(String(initial.publisherPoints));const [collector,setCollector]=useState(String(initial.collectorPoints));
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
 const dirty=publisher!==String(saved.publisherPoints)||collector!==String(saved.collectorPoints);
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(busy)return;setError('');setNotice('');
  const parsed=pointValuesSchema.safeParse({publisherPoints:Number(publisher),collectorPoints:Number(collector)});
  if(!/^\d+$/.test(publisher)||!/^\d+$/.test(collector)||!parsed.success){setError('Escribe puntos enteros entre 0 y 1000000 para ambos participantes.');return;}
  setBusy(true);try{const result=await saveMaterialPoints(initial.materialType,parsed.data);setSaved(result.data);setPublisher(String(result.data.publisherPoints));setCollector(String(result.data.collectorPoints));setNotice(result.message);}
  catch(cause){setError(cause instanceof Error?cause.message:'No se pudieron guardar los puntos. Intenta nuevamente.');}finally{setBusy(false);}
 }
 const material=initial.materialType;
 return <form className="material-point-card" aria-labelledby={`${material}-title`} onSubmit={submit}>
  <div className="material-point-heading"><h2 id={`${material}-title`}>{labels[material]}</h2><span className="status">{saved.isDefault?'Por defecto':'Configurado'}</span></div>
  <div className="material-point-fields">
   <FormField id={`${material}-publisher`} label="Puntos para el publicador"><Input id={`${material}-publisher`} type="number" inputMode="numeric" min="0" max="1000000" step="1" required disabled={busy} value={publisher} onChange={e=>{setPublisher(e.target.value);setNotice('');}}/></FormField>
   <FormField id={`${material}-collector`} label="Puntos para la empresa"><Input id={`${material}-collector`} type="number" inputMode="numeric" min="0" max="1000000" step="1" required disabled={busy} value={collector} onChange={e=>{setCollector(e.target.value);setNotice('');}}/></FormField>
  </div>
  {error&&<Alert isError>{error}</Alert>}{notice&&<Alert>{notice}</Alert>}
  <Button type="submit" disabled={busy||!dirty}>{busy?'Guardando…':`Guardar ${labels[material].toLowerCase()}`}</Button>
 </form>;
}
