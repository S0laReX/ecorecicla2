'use client';
import {useEffect,useState} from 'react';
import type {Publication,CreatePublicationInput} from '../../types/publication';
import {MATERIAL_TYPES,MATERIAL_LABELS} from '../../constants/publicationConstants';
import {FormField} from '../../../../shared/components/molecules/FormField';import {Input} from '../../../../shared/components/atoms/Input';import {Button} from '../../../../shared/components/atoms/Button';
interface Props{initial?:Publication;isSubmitting:boolean;fieldErrors?:Partial<Record<keyof CreatePublicationInput,string[]>>;onSubmit:(input:unknown)=>Promise<boolean>}
export function PublicationForm({initial,isSubmitting,fieldErrors={},onSubmit}:Props){
 const [photo,setPhoto]=useState<File|null>(null);const [preview,setPreview]=useState('');
 useEffect(()=>{if(!photo){setPreview('');return;}const url=URL.createObjectURL(photo);setPreview(url);return()=>URL.revokeObjectURL(url);},[photo]);
 return <form className="panel" onSubmit={async event=>{event.preventDefault();if(isSubmitting)return;const form=event.currentTarget;const body=new FormData(form);const values:Record<string,unknown>=Object.fromEntries(body.entries());if(initial&&!photo)delete values.photo;if(await onSubmit(values)){if(!initial){form.reset();setPhoto(null);}}}}>
 <fieldset disabled={isSubmitting}><legend>{initial?'Actualiza los datos de tu material':'Cuéntanos qué material tienes'}</legend>
 <FormField id="materialType" label="Tipo de material" error={fieldErrors.materialType?.[0]}><select id="materialType" name="materialType" required defaultValue={initial?.publicationMaterialType||'plastico'}>{MATERIAL_TYPES.map(type=><option key={type} value={type}>{MATERIAL_LABELS[type]}</option>)}</select></FormField>
 <FormField id="quantityKg" label="Cantidad en kilogramos" error={fieldErrors.quantityKg?.[0]}><Input id="quantityKg" name="quantityKg" required inputMode="decimal" maxLength={11} placeholder="Ej. 2.500" defaultValue={initial?.publicationQuantityKg} aria-invalid={!!fieldErrors.quantityKg} aria-describedby={fieldErrors.quantityKg?'quantityKg-error':undefined}/></FormField>
 <FormField id="locationText" label="Ubicación de recolección" error={fieldErrors.locationText?.[0]}><Input id="locationText" name="locationText" required minLength={3} maxLength={300} placeholder="Zona, calle y una referencia" defaultValue={initial?.publicationLocationText} aria-invalid={!!fieldErrors.locationText} aria-describedby={fieldErrors.locationText?'locationText-error':undefined}/></FormField>
 <FormField id="availabilityText" label="Horario disponible" error={fieldErrors.availabilityText?.[0]}><Input id="availabilityText" name="availabilityText" required minLength={3} maxLength={200} placeholder="Ej. Lunes de 16:00 a 18:00" defaultValue={initial?.publicationAvailabilityText} aria-invalid={!!fieldErrors.availabilityText} aria-describedby={fieldErrors.availabilityText?'availabilityText-error':undefined}/></FormField>
 <div className="full-span"><FormField id="photo" label={initial?'Cambiar foto (opcional)':'Foto del material'} error={fieldErrors.photo?.[0]}><Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required={!initial} onChange={event=>setPhoto(event.target.files?.[0]||null)} aria-invalid={!!fieldErrors.photo} aria-describedby="photo-help"/></FormField><p id="photo-help" className="muted">JPEG, PNG o WebP de hasta 5 MiB. Puedes elegir una imagen desde tu teléfono.</p>
 {(preview||initial?.publicationPhotoDataUrl)&&<img className="photo-preview" src={preview||initial?.publicationPhotoDataUrl} alt="Vista previa del material"/>}</div>
 <Button type="submit">{isSubmitting?'Guardando…':initial?'Guardar cambios':'Publicar material'}</Button>
 </fieldset></form>;
}
