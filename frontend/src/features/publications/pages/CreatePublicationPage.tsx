'use client';
import {useCreatePublication} from '../hooks/useCreatePublication';
import {MATERIAL_TYPES,MATERIAL_LABELS} from '../constants/publicationConstants';
import {FormField} from '../components/molecules/FormField';
import {Alert} from '../components/molecules/Alert';
import {Input} from '../components/atoms/Input';
import {Button} from '../components/atoms/Button';
import {PublicationCard} from '../components/organisms/PublicationCard';
export function CreatePublicationPage() {
 const {submit,fieldErrors,isSubmitting,error,created}=useCreatePublication();
 return <section><h1>Publica tu material reciclable</h1><p>Indica qué tienes y cuándo pueden recogerlo. Cantidades en kilogramos.</p>
 <form onSubmit={async event=>{
  event.preventDefault();const form=event.currentTarget;const data=new FormData(form);
  const publication=await submit(Object.fromEntries(data.entries()));if(publication)form.reset();
 }}>
  <fieldset disabled={isSubmitting}><legend>Datos de la publicación</legend>
   <FormField id="materialType" label="Tipo de material" error={fieldErrors.materialType?.[0]}>
    <select id="materialType" name="materialType" required>{MATERIAL_TYPES.map(type=><option key={type} value={type}>{MATERIAL_LABELS[type]}</option>)}</select>
   </FormField>
   {([{name:'quantityKg',label:'Cantidad (kg)',max:11},{name:'locationText',label:'Ubicación (texto)',max:300},{name:'availabilityText',label:'Horario disponible',max:200}] as const).map(field=><FormField key={field.name} id={field.name} label={field.label} error={fieldErrors[field.name]?.[0]}>
    <Input id={field.name} name={field.name} required maxLength={field.max} inputMode={field.name==='quantityKg'?'decimal':'text'} aria-invalid={!!fieldErrors[field.name]} aria-describedby={fieldErrors[field.name]?`${field.name}-error`:undefined}/>
   </FormField>)}
   <FormField id="photo" label="Foto (JPEG, PNG o WebP; hasta 5 MiB)" error={fieldErrors.photo?.[0]}>
    <Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required aria-invalid={!!fieldErrors.photo} aria-describedby={fieldErrors.photo?'photo-error':undefined}/>
   </FormField><Button type="submit">{isSubmitting?'Publicando…':'Publicar material'}</Button>
  </fieldset>
 </form>{error&&<Alert isError>{error.message}</Alert>}
 {created&&<><Alert>Publicación creada correctamente.</Alert><PublicationCard publication={created} isOwner/></>}
 </section>;
}
