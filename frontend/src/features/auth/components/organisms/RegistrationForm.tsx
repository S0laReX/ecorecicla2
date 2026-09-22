'use client';
import {useState} from 'react';
import Link from 'next/link';
import {Button} from '../../../../shared/components/atoms/Button';
import {Input} from '../../../../shared/components/atoms/Input';
import {FormField} from '../../../../shared/components/molecules/FormField';
import {Alert} from '../../../../shared/components/molecules/Alert';
import {registrationSchema} from '../../schemas/authSchema';
import {registerAccount} from '../../services/registrationService';
export function RegistrationForm(){
 const [role,setRole]=useState('USER');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [success,setSuccess]=useState('');
 return <form className="panel auth-form" onSubmit={async e=>{
  e.preventDefault();if(busy)return;setError('');setSuccess('');const form=e.currentTarget;const body=new FormData(form);
  const values=Object.fromEntries([...body.entries()].filter(([key])=>key!=='document'));
  const parsed=registrationSchema.safeParse(values);if(!parsed.success){setError(parsed.error.issues[0].message);return;}
  if(role==='COMPANY'){const file=body.get('document');if(!(file instanceof File)||file.size<4||file.size>5242880){setError('Adjunta un documento de hasta 5 MiB.');return;}}
  setBusy(true);try{setSuccess(await registerAccount(body));form.reset();setRole('USER');}catch(cause){setError(cause instanceof Error?cause.message:'No se pudo registrar.');}finally{setBusy(false);}
 }}><fieldset disabled={busy}><legend>Tu cuenta en EcoRecicla</legend>
 <FormField id="roleCode" label="Quiero registrarme como"><select id="roleCode" name="roleCode" value={role} onChange={e=>setRole(e.target.value)}><option value="USER">Persona que recicla</option><option value="COMPANY">Empresa recolectora</option></select></FormField>
 <FormField id="displayName" label={role==='COMPANY'?'Nombre de la empresa':'Nombre completo'}><Input id="displayName" name="displayName" autoComplete="name" required minLength={2} maxLength={120}/></FormField>
 <FormField id="email" label="Correo electrónico"><Input id="email" name="email" type="email" autoComplete="email" required maxLength={254}/></FormField>
 <FormField id="password" label="Contraseña (12 caracteres, letras y números)"><Input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></FormField>
 {role==='COMPANY'&&<><FormField id="taxIdentifier" label="RUC / NIT"><Input id="taxIdentifier" name="taxIdentifier" required minLength={4} maxLength={40}/></FormField>
 <FormField id="contactName" label="Persona de contacto"><Input id="contactName" name="contactName" required minLength={2} maxLength={120}/></FormField>
 <FormField id="coverageArea" label="Zona de cobertura"><Input id="coverageArea" name="coverageArea" required minLength={3} maxLength={300}/></FormField>
 <FormField id="document" label="Documento de verificación (PDF o imagen; hasta 5 MiB)"><Input id="document" name="document" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required/></FormField>
 <Alert>Tu empresa quedará pendiente de aprobación. Podrás publicar material propio mientras se revisa tu solicitud.</Alert></>}
 <Button type="submit">{busy?'Creando cuenta…':'Crear cuenta'}</Button></fieldset>
 {error&&<Alert isError>{error}</Alert>}{success&&<Alert>{success} <Link href="/login">Iniciar sesión</Link></Alert>}
 <p>¿Ya tienes una cuenta? <Link href="/login">Inicia sesión</Link></p></form>;
}
