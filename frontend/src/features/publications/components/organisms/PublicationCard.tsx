'use client';
import {useId,useState} from 'react';
import type {Publication} from '../../types/publication';
import {MATERIAL_LABELS} from '../../constants/publicationConstants';
import {Button} from '../atoms/Button';
import {Icon} from '../atoms/Icon';
import {Alert} from '../molecules/Alert';
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
 const canManage=isOwner && p.publicationStatus==='disponible';
 async function confirmDelete() {
  if(!canManage || !onDelete || isDeleting || !window.confirm('¿Eliminar esta publicación?'))return;
  setDeleting(true);setError(null);
  try {await onDelete(p.publicationUUID);}catch{setError('No se pudo eliminar. Actualiza el listado para comprobar su estado.');}finally{setDeleting(false);}
 }
 return <article className="publication-card" aria-labelledby={titleId} aria-busy={isDeleting}>
  {/* Normalized JPEG data URL; no third-party image request or SVG. */}
  <img src={p.publicationPhotoDataUrl} alt={`Material reciclable: ${MATERIAL_LABELS[p.publicationMaterialType]}`} width={640} height={400} loading="lazy"/>
  <div className="card-body"><h2 id={titleId}><Icon/> {MATERIAL_LABELS[p.publicationMaterialType]}</h2>
   <p className="badge">{p.publicationStatus}</p><dl>
    <dt>Cantidad</dt><dd>{p.publicationQuantityKg} kg</dd>
    <dt>Ubicación</dt><dd>{p.publicationLocationText}</dd>
    <dt>Horario disponible</dt><dd>{p.publicationAvailabilityText}</dd>
   </dl><div className="actions">
    {onView&&<Button onClick={()=>onView(p.publicationUUID)}>Ver detalle</Button>}
    {isOwner&&onEdit&&<Button disabled={!canManage||isDeleting} onClick={()=>{if(canManage)onEdit(p.publicationUUID);}}>Editar</Button>}
    {isOwner&&onDelete&&<Button disabled={!canManage||isDeleting} onClick={()=>void confirmDelete()}>{isDeleting?'Eliminando…':'Eliminar'}</Button>}
   </div>{isOwner&&!canManage&&<Alert>Solo puedes editar o eliminar publicaciones disponibles.</Alert>}
   {error&&<Alert isError>{error}</Alert>}
  </div>
 </article>;
}
