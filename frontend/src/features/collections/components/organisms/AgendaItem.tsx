'use client';
import {useEffect,useState} from 'react';
import type {AgendaReservation} from '../../types/collection';
import {MATERIAL_LABELS} from '../../constants/collectionConstants';
import {Button} from '../../../../shared/components/atoms/Button';
import {Modal} from '../../../../shared/components/molecules/Modal';
export function AgendaItem({reservation,onCancel,onConfirm,isCancelling,isConfirming,disabled}:{reservation:AgendaReservation;onCancel:(uuid:string)=>Promise<boolean>;onConfirm:(uuid:string)=>Promise<boolean>;isCancelling:boolean;isConfirming:boolean;disabled:boolean}){
 const [collecting,setCollecting]=useState(false);const [now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const hasStarted=now>=new Date(reservation.reservationScheduledAt).getTime();
 const hasExpired=now>new Date(reservation.reservationExpiresAt).getTime();
 const expiresLabel=new Intl.DateTimeFormat('es-BO',{timeZone:'America/La_Paz',dateStyle:'short',timeStyle:'short'}).format(new Date(reservation.reservationExpiresAt));
 const [confirming,setConfirming]=useState(false);const [cancelError,setCancelError]=useState('');
 const date=new Date(reservation.reservationScheduledAt);const displayDate=new Intl.DateTimeFormat('es-BO',{timeZone:'America/La_Paz',dateStyle:'full',timeStyle:'short'}).format(date);
 async function confirmCancellation(){setCancelError('');const cancelled=await onCancel(reservation.reservationUUID);if(cancelled)setConfirming(false);else setCancelError('La reserva cambió de estado. Actualiza la agenda antes de volver a intentarlo.');}
 return <article className="agenda-item panel" aria-busy={isCancelling||isConfirming}>
  <img className="agenda-item-photo" src={reservation.publicationPhotoDataUrl} alt={`${MATERIAL_LABELS[reservation.publicationMaterialType]} agendado`} width={640} height={420}/>
  <div className="agenda-item-body"><div className="agenda-item-heading"><span className="badge badge-aceptada">Aceptada</span><h2>{MATERIAL_LABELS[reservation.publicationMaterialType]}</h2></div>
   <p className="agenda-item-schedule"><span>Fecha y hora</span><time dateTime={reservation.reservationScheduledAt}>{displayDate}</time></p>
   <dl><dt>Cantidad</dt><dd>{reservation.publicationQuantityKg} kg</dd><dt>Ubicación</dt><dd>{reservation.publicationLocationText}</dd><dt>Horario indicado</dt><dd>{reservation.publicationAvailabilityText}</dd><dt>Publicado por</dt><dd>{reservation.publisherName}</dd></dl>
   <p className="agenda-deadline">Confirmar hasta: <time dateTime={reservation.reservationExpiresAt}>{expiresLabel}</time> (Bolivia)</p>
   <Button className="agenda-confirm-action" disabled={disabled||!hasStarted||hasExpired} onClick={()=>setCollecting(true)}>{isConfirming?'Confirmando…':'Confirmar recolección'}</Button>
   {!hasStarted&&<p className="agenda-time-hint">Podrás confirmar desde la hora reservada.</p>}
   {hasExpired&&<p role="status">Horario vencido. La publicación volverá a estar disponible sin penalización.</p>}
   <Button className="button-danger agenda-cancel-action" disabled={disabled} onClick={()=>setConfirming(true)}>{isCancelling?'Cancelando…':'Cancelar reserva'}</Button>
  </div>
  <Modal open={collecting} title="¿Ya recogiste este material?" onClose={()=>{if(!isConfirming)setCollecting(false);}}>
   <p>Confirma únicamente después de recoger el material. Se otorgarán los puntos correspondientes al publicador y a tu empresa.</p>
   <div className="actions"><Button disabled={disabled||!hasStarted||hasExpired} onClick={async()=>{await onConfirm(reservation.reservationUUID);setCollecting(false);}}>{isConfirming?'Confirmando…':'Sí, confirmar recolección'}</Button><Button className="button-secondary" disabled={disabled} onClick={()=>setCollecting(false)}>Volver</Button></div>
  </Modal>
  <Modal open={confirming} title="¿Cancelar esta recolección?" onClose={()=>{if(!isCancelling)setConfirming(false);}}>
   <p>La publicación volverá a estar disponible para otras empresas.</p>{cancelError&&<p className="alert error" role="alert">{cancelError}</p>}
   <div className="actions"><Button className="button-danger" disabled={disabled} onClick={()=>void confirmCancellation()}>{isCancelling?'Cancelando…':'Sí, cancelar reserva'}</Button><Button className="button-secondary" disabled={disabled} onClick={()=>setConfirming(false)}>Conservar reserva</Button></div>
  </Modal>
 </article>;
}
