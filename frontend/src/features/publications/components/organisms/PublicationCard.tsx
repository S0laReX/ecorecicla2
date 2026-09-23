'use client';
import {useId,useState} from 'react';
import type {Publication} from '../../types/publication';
import {MATERIAL_LABELS} from '../../constants/publicationConstants';
import {Button} from '../atoms/Button';
import {Icon} from '../atoms/Icon';
import {Alert} from '../molecules/Alert';
import {Modal} from '../../../../shared/components/molecules/Modal';
export interface PublicationCardProps {
 publication:Publication;
 /** Presentation hint only. Backend must independently verify current owner and status. */
 isOwner:boolean;
 onView?:(publicationUUID:string)=>void;
 onEdit?:(publicationUUID:string)=>void;
 onDelete?:(publicationUUID:string)=>Promise<void>;
}
export function PublicationCard({publication:p,isOwner,onView,onEdit,onDelete}:PublicationCardProps) {
 const titleId=useId();const [isDeleting,setDeleting]=useState(false);const [error,setError]=useState<string|null>(null);
 const [confirming,setConfirming]=useState(false);
 const canManage=isOwner && p.publicationStatus==='disponible';
 async function confirmDelete() {
  if(!canManage || !onDelete || isDeleting)return;
  setDeleting(true);setError(null);
  try {await onDelete(p.publicationUUID);setConfirming(false);}catch{setError('No se pudo eliminar. Actualiza el listado para comprobar su estado.');setConfirming(false);}finally{setDeleting(false);}
 }
 return <article className="publication-card" aria-labelledby={titleId} aria-busy={isDeleting}>
  {/* Normalized JPEG data URL; no third-party image request or SVG. */}
  <img src={p.publicationPhotoDataUrl} alt={`Material reciclable: ${MATERIAL_LABELS[p.publicationMaterialType]}`} width={640} height={400} loading="lazy"/>
  <div className="card-body"><h2 id={titleId}><Icon/> {MATERIAL_LABELS[p.publicationMaterialType]}</h2>
   <p className={`badge badge-${p.publicationStatus}`}>{p.publicationStatus}</p><dl>
    <dt>Cantidad</dt><dd>{p.publicationQuantityKg} kg</dd>
    <dt>Ubicación</dt><dd>{p.publicationLocationText}</dd>
    <dt>Horario disponible</dt><dd>{p.publicationAvailabilityText}</dd>
   </dl><div className="actions">
    {onView&&<Button onClick={()=>onView(p.publicationUUID)}>Ver detalle</Button>}
    {isOwner&&onEdit&&<Button className="button-secondary" disabled={!canManage||isDeleting} onClick={()=>{if(canManage)onEdit(p.publicationUUID);}}>Editar</Button>}
    {isOwner&&onDelete&&<Button className="button-danger" disabled={!canManage||isDeleting} onClick={()=>setConfirming(true)}>{isDeleting?'Eliminando…':'Eliminar'}</Button>}
   </div>{isOwner&&!canManage&&<Alert>Solo puedes editar o eliminar publicaciones disponibles.</Alert>}
   {error&&<Alert isError>{error}</Alert>}
   <Modal open={confirming} title="¿Eliminar esta publicación?" onClose={()=>{if(!isDeleting)setConfirming(false);}}><p>El material dejará de aparecer en tus publicaciones.</p><div className="actions"><Button disabled={isDeleting} onClick={()=>void confirmDelete()}>{isDeleting?'Eliminando…':'Sí, eliminar'}</Button><Button disabled={isDeleting} onClick={()=>setConfirming(false)}>Cancelar</Button></div></Modal>
  </div>
 </article>;
}
