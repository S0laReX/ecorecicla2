'use client';
import {useEffect,useState} from 'react';
import type {Publication,CreatePublicationInput} from '../../types/publication';
import {MATERIAL_TYPES,MATERIAL_LABELS} from '../../constants/publicationConstants';
import {FormField} from '../../../../shared/components/molecules/FormField';
import {Input} from '../../../../shared/components/atoms/Input';
import {Button} from '../../../../shared/components/atoms/Button';
import {DesignIcon,type DesignIconName} from '../../../../shared/components/atoms/DesignIcon';
import {AvailabilityPicker} from '../molecules/AvailabilityPicker';
const materialIcons:Record<string,DesignIconName>={plastico:'plastic',papel:'paper',vidrio:'glass',metal:'metal',organico:'leaf'};
interface Props{initial?:Publication;isSubmitting:boolean;fieldErrors?:Partial<Record<keyof CreatePublicationInput,string[]>>;onSubmit:(input:unknown)=>Promise<boolean>}
export function PublicationForm({initial,isSubmitting,fieldErrors={},onSubmit}:Props){
 const [photo,setPhoto]=useState<File|null>(null);const [preview,setPreview]=useState('');
 useEffect(()=>{if(!photo){setPreview('');return;}const url=URL.createObjectURL(photo);setPreview(url);return()=>URL.revokeObjectURL(url);},[photo]);
 return <form className="publication-form" onSubmit={async event=>{event.preventDefault();if(isSubmitting)return;const form=event.currentTarget;const body=new FormData(form);const values:Record<string,unknown>=Object.fromEntries(body.entries());if(initial&&!photo)delete values.photo;if(await onSubmit(values)){if(!initial){form.reset();setPhoto(null);}}}}>
 <fieldset disabled={isSubmitting} className="publication-fields"><legend className="sr-only">{initial?'Actualiza los datos de tu material':'Datos del material para publicar'}</legend>
 <section className="panel"><h2>Tipo de Material</h2><p className="section-help">Selecciona el material que vas a publicar.</p>
 <fieldset className="material-selector" aria-describedby={fieldErrors.materialType?'materialType-error':undefined}><legend className="sr-only">Tipo de material</legend>{MATERIAL_TYPES.map(type=><label className={`material-choice material-${type}`} key={type}><input type="radio" name="materialType" value={type} required defaultChecked={type===(initial?.publicationMaterialType||'plastico')}/><span><DesignIcon name={materialIcons[type]}/><strong>{MATERIAL_LABELS[type]}</strong></span></label>)}</fieldset>
 {fieldErrors.materialType&&<p className="error" id="materialType-error">{fieldErrors.materialType[0]}</p>}
 <FormField id="quantityKg" label="Cantidad en kilogramos" error={fieldErrors.quantityKg?.[0]}><Input id="quantityKg" name="quantityKg" required inputMode="decimal" maxLength={11} placeholder="Ej. 2.500" defaultValue={initial?.publicationQuantityKg} aria-invalid={!!fieldErrors.quantityKg} aria-describedby={fieldErrors.quantityKg?'quantityKg-error':undefined}/></FormField></section>
 <section className="panel"><h2>Ubicación de recolección</h2><p className="section-help">Indica dónde se encuentra el material.</p><FormField id="locationText" label="Dirección y referencia" error={fieldErrors.locationText?.[0]}><div className="input-with-icon"><DesignIcon name="location"/><Input id="locationText" name="locationText" required minLength={3} maxLength={300} placeholder="Zona, calle y una referencia" defaultValue={initial?.publicationLocationText} aria-invalid={!!fieldErrors.locationText} aria-describedby={fieldErrors.locationText?'locationText-error':undefined}/></div></FormField></section>
 <section className="panel"><h2>Disponibilidad</h2><p className="section-help">Indica los días y el rango de horas en que puedes entregar el material. Para que una empresa pueda agendar, usa un día o rango de días y horas, por ejemplo: “Lunes a viernes de 09:00 a 17:00”.</p><AvailabilityPicker initial={initial?.publicationAvailabilityText} error={fieldErrors.availabilityText?.[0]}/></section>
 <section className="panel"><h2>Foto del material</h2><p id="photo-help" className="section-help">{initial?'Cambia la foto si lo necesitas.':'Muestra los materiales que quieres reciclar.'} JPG, PNG o WebP de hasta 5 MiB.</p><div className="upload-zone"><DesignIcon name="document"/><p>{photo?.name||'Selecciona una foto de tu dispositivo'}</p><Input id="photo" name="photo" type="file" aria-label={initial?'Cambiar foto (opcional)':'Foto del material'} accept="image/jpeg,image/png,image/webp" required={!initial} onChange={event=>setPhoto(event.target.files?.[0]||null)} aria-invalid={!!fieldErrors.photo} aria-describedby="photo-help"/></div>{fieldErrors.photo&&<p className="error">{fieldErrors.photo[0]}</p>}
 {(preview||initial?.publicationPhotoDataUrl)&&<img className="photo-preview" src={preview||initial?.publicationPhotoDataUrl} alt="Vista previa del material"/>}</section>
 <Button type="submit"><DesignIcon name="upload"/>{isSubmitting?'Guardando…':initial?'Guardar cambios':'Publicar material'}</Button>
 </fieldset></form>;
}
