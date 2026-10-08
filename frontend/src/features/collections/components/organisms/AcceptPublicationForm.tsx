'use client';
import {useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {acceptAvailablePublication} from '../../services/collectionService';
import {ApiRequestError} from '../../../auth/services/sessionService';
import {Button} from '../../../../shared/components/atoms/Button';
import {Alert} from '../../../../shared/components/molecules/Alert';
export function AcceptPublicationForm({publicationUUID,availabilityText}:{publicationUUID:string;availabilityText:string}){
 const router=useRouter();const [scheduledAt,setScheduledAt]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const boliviaFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'America/La_Paz',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const minimumLocalDateTime=()=>{const parts=Object.fromEntries(boliviaFormatter.formatToParts(new Date()).map(part=>[part.type,part.value]));return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;};
 const parseBoliviaDateTime=(value:string)=>{const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);if(!match)return new Date(Number.NaN);const desired=Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),Number(match[4]),Number(match[5]));let estimate=desired;for(let attempt=0;attempt<2;attempt++){const parts=Object.fromEntries(boliviaFormatter.formatToParts(new Date(estimate)).map(part=>[part.type,part.value]));const represented=Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute));estimate+=desired-represented;}return new Date(estimate);};
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError('');
  const selectedDate=parseBoliviaDateTime(scheduledAt);
  if(!scheduledAt||!Number.isFinite(selectedDate.getTime())||selectedDate.getTime()<=Date.now()){setError('Selecciona una fecha y hora futuras dentro del horario indicado.');return;}
  setBusy(true);try{await acceptAvailablePublication(publicationUUID,selectedDate.toISOString());router.push('/agenda');}
  catch(cause){setError(cause instanceof ApiRequestError?cause.message:'No se pudo reservar la publicación. Actualiza el detalle e inténtalo nuevamente.');}
  finally{setBusy(false);}
 }
 return <form className="accept-publication-form panel" onSubmit={event=>void submit(event)} aria-busy={busy}>
  <div><p className="eyebrow">AGENDA DE RECOLECCIONES</p><h2>Agendar esta recolección</h2>
   <p className="muted">Horario indicado por quien publicó: <strong>{availabilityText}</strong></p>
   <p className="muted">Elige una fecha y hora futura dentro de ese horario. La API volverá a comprobar la disponibilidad al reservar. La aceptación no asigna puntos; se consideran al confirmar la recolección.</p>
  </div>
  <div className="field"><label htmlFor="collection-scheduled-at">Fecha y hora de recolección (hora de Bolivia)</label>
   <input id="collection-scheduled-at" type="datetime-local" min={minimumLocalDateTime()} required value={scheduledAt} disabled={busy} onChange={event=>setScheduledAt(event.target.value)} aria-describedby="collection-schedule-help"/>
   <small id="collection-schedule-help" className="muted">Confirma el horario con quien publicó antes de agendar. La hora se interpreta en America/La_Paz.</small>
  </div>
  {error&&<Alert isError>{error}</Alert>}
  <Button type="submit" className="accept-action" disabled={busy}>{busy?'Agendando…':'Confirmar aceptación'}</Button>
 </form>;
}
