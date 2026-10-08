'use client';
import {useState} from 'react';
import type {AgendaReservation} from '../../types/collection';
import {MATERIAL_LABELS} from '../../constants/collectionConstants';
import {Button} from '../../../../shared/components/atoms/Button';
import {Modal} from '../../../../shared/components/molecules/Modal';
export function AgendaItem({reservation,onCancel,isCancelling}:{reservation:AgendaReservation;onCancel:(uuid:string)=>Promise<boolean>;isCancelling:boolean}){
 const [confirming,setConfirming]=useState(false);const [cancelError,setCancelError]=useState('');
 const date=new Date(reservation.reservationScheduledAt);const displayDate=new Intl.DateTimeFormat('es-BO',{timeZone:'America/La_Paz',dateStyle:'full',timeStyle:'short'}).format(date);
 async function confirmCancellation(){setCancelError('');const cancelled=await onCancel(reservation.reservationUUID);if(cancelled)setConfirming(false);else setCancelError('La reserva cambió de estado. Actualiza la agenda antes de volver a intentarlo.');}
 return <article className="agenda-item panel" aria-busy={isCancelling}>
  <img className="agenda-item-photo" src={reservation.publicationPhotoDataUrl} alt={`${MATERIAL_LABELS[reservation.publicationMaterialType]} agendado`} width={640} height={420}/>
  <div className="agenda-item-body"><div className="agenda-item-heading"><span className="badge badge-aceptada">Aceptada</span><h2>{MATERIAL_LABELS[reservation.publicationMaterialType]}</h2></div>
   <p className="agenda-item-schedule"><span>Fecha y hora</span><time dateTime={reservation.reservationScheduledAt}>{displayDate}</time></p>
   <dl><dt>Cantidad</dt><dd>{reservation.publicationQuantityKg} kg</dd><dt>Ubicación</dt><dd>{reservation.publicationLocationText}</dd><dt>Horario indicado</dt><dd>{reservation.publicationAvailabilityText}</dd><dt>Publicado por</dt><dd>{reservation.publisherName}</dd></dl>
   <Button className="button-danger agenda-cancel-action" disabled={isCancelling} onClick={()=>setConfirming(true)}>{isCancelling?'Cancelando…':'Cancelar reserva'}</Button>
  </div>
  <Modal open={confirming} title="¿Cancelar esta recolección?" onClose={()=>{if(!isCancelling)setConfirming(false);}}>
   <p>La publicación volverá a estar disponible para otras empresas.</p>{cancelError&&<p className="alert error" role="alert">{cancelError}</p>}
   <div className="actions"><Button className="button-danger" disabled={isCancelling} onClick={()=>void confirmCancellation()}>{isCancelling?'Cancelando…':'Sí, cancelar reserva'}</Button><Button className="button-secondary" disabled={isCancelling} onClick={()=>setConfirming(false)}>Conservar reserva</Button></div>
  </Modal>
 </article>;
}
