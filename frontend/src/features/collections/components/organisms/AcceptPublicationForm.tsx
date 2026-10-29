'use client';
import {useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {acceptAvailablePublication} from '../../services/collectionService';
import {ApiRequestError} from '../../../auth/services/sessionService';
import {Button} from '../../../../shared/components/atoms/Button';
import {Alert} from '../../../../shared/components/molecules/Alert';
import {availableTimes,parseAvailability} from '../../utils/availability';
export function AcceptPublicationForm({publicationUUID,availabilityText}:{publicationUUID:string;availabilityText:string}){
 const router=useRouter();const [date,setDate]=useState('');const [time,setTime]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const boliviaFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'America/La_Paz',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const minimumLocalDateTime=()=>{const parts=Object.fromEntries(boliviaFormatter.formatToParts(new Date()).map(part=>[part.type,part.value]));return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;};
 const times=availableTimes(availabilityText,date);
 const validWindow=parseAvailability(availabilityText);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError('');
  const selectedDate=new Date(`${date}T${time}:00-04:00`);
  if(!times.includes(time)||!Number.isFinite(selectedDate.getTime())||selectedDate.getTime()<=Date.now()){setError('Selecciona una fecha y hora futuras dentro del horario indicado.');return;}
  setBusy(true);try{await acceptAvailablePublication(publicationUUID,selectedDate.toISOString());router.push('/agenda');}
  catch(cause){setError(cause instanceof ApiRequestError?cause.message:'No se pudo reservar la publicación. Actualiza el detalle e inténtalo nuevamente.');}
  finally{setBusy(false);}
 }
 return <form className="accept-publication-form panel" onSubmit={event=>void submit(event)} aria-busy={busy}>
  <div><p className="eyebrow">AGENDA DE RECOLECCIONES</p><h2>Agendar esta recolección</h2>
   <p className="muted">Horario indicado por quien publicó: <strong>{availabilityText}</strong></p>
   <p className="muted">Elige una fecha y hora futura dentro de ese horario. La API volverá a comprobar la disponibilidad al reservar. La aceptación no asigna puntos; se consideran al confirmar la recolección.</p>
  </div>
  {!validWindow&&<Alert isError>La disponibilidad de esta publicación no tiene un formato válido. Quien publicó debe actualizar los días y horas antes de agendar.</Alert>}
  <div className="availability-hours"><div className="field"><label htmlFor="collection-date">Fecha de recolección (hora de Bolivia)</label><input id="collection-date" type="date" min={minimumLocalDateTime().slice(0,10)} required value={date} disabled={busy||!validWindow} onChange={event=>{setDate(event.target.value);setTime('');setError('');}}/></div>
  <div className="field"><label htmlFor="collection-time">Hora de recolección (formato de 24 horas)</label><select id="collection-time" required value={time} disabled={busy||!times.length} onChange={event=>setTime(event.target.value)}><option value="">Selecciona una hora</option>{times.map(value=><option key={value} value={value}>{value}</option>)}</select></div></div>
  {date&&validWindow&&!times.length&&<Alert isError>Esta fecha no tiene horarios disponibles. Selecciona uno de los días publicados y una fecha futura.</Alert>}
  <p className="muted">Solo se ofrecen horas dentro de la disponibilidad publicada. Las horas se muestran de 00:00 a 23:59, en hora de Bolivia.</p>
  {error&&<Alert isError>{error}</Alert>}
  <Button type="submit" className="accept-action" disabled={busy||!times.includes(time)}>{busy?'Agendando…':'Confirmar aceptación'}</Button>
 </form>;
}
