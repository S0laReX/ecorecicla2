'use client';
import {useState} from 'react';
import Link from 'next/link';
import {Button} from '../../../../shared/components/atoms/Button';
import {Input} from '../../../../shared/components/atoms/Input';
import {DesignIcon} from '../../../../shared/components/atoms/DesignIcon';
import {FormField} from '../../../../shared/components/molecules/FormField';
import {Alert} from '../../../../shared/components/molecules/Alert';
import {registrationSchema} from '../../schemas/authSchema';
import {registerAccount} from '../../services/registrationService';
export function RegistrationForm(){
 const [role,setRole]=useState('USER');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [success,setSuccess]=useState('');
 const [documentName,setDocumentName]=useState('');
 return <form className={`panel auth-form ${role==='COMPANY'?'company-form':''}`} onSubmit={async e=>{
  e.preventDefault();if(busy)return;setError('');setSuccess('');const form=e.currentTarget;const body=new FormData(form);
  const values=Object.fromEntries([...body.entries()].filter(([key])=>key!=='document'));
  const parsed=registrationSchema.safeParse(values);if(!parsed.success){setError(parsed.error.issues[0].message);return;}
  if(role==='COMPANY'){const file=body.get('document');if(!(file instanceof File)||file.size<4||file.size>5242880){setError('Adjunta un documento de hasta 5 MiB.');return;}}
  setBusy(true);try{setSuccess(await registerAccount(body));form.reset();setRole('USER');setDocumentName('');}catch(cause){setError(cause instanceof Error?cause.message:'No se pudo registrar.');}finally{setBusy(false);}
 }}>
 <div className="auth-heading"><h1>{role==='COMPANY'?'Registro de Empresa':'Crea tu cuenta'}</h1><p>{role==='COMPANY'?'Únete a nuestra red de centros de reciclaje y contribuye al medio ambiente.':'Comienza a hacer la diferencia hoy mismo.'}</p></div>
 <fieldset disabled={busy}><legend className="sr-only">Datos de registro</legend>
 <fieldset className="role-selector"><legend className="sr-only">Tipo de cuenta</legend>{(['USER','COMPANY'] as const).map(value=><label key={value}><input type="radio" name="roleCode" value={value} checked={role===value} onChange={()=>{setRole(value);setError('');setDocumentName('');}}/><span><DesignIcon name={value==='USER'?'person':'company'}/>{value==='USER'?'Usuario':'Empresa'}</span></label>)}</fieldset>
 <FormField id="displayName" label={role==='COMPANY'?'Nombre de la Empresa':'Nombre Completo'}><div className="input-with-icon"><DesignIcon name="identity"/><Input id="displayName" name="displayName" placeholder={role==='COMPANY'?'Ej. Recicladora Verde':'Ej. Juan Pérez'} autoComplete={role==='COMPANY'?'organization':'name'} required minLength={2} maxLength={120}/></div></FormField>
 {role==='COMPANY'&&<><FormField id="taxIdentifier" label="RUC / NIT"><Input id="taxIdentifier" name="taxIdentifier" placeholder="Número de identificación tributaria" required minLength={4} maxLength={40}/></FormField><FormField id="contactName" label="Nombre de Contacto"><Input id="contactName" name="contactName" placeholder="Nombre de la persona responsable" autoComplete="name" required minLength={2} maxLength={120}/></FormField></>}
 <FormField id="email" label="Correo Electrónico"><div className="input-with-icon"><DesignIcon name="email"/><Input id="email" name="email" type="email" placeholder={role==='COMPANY'?'correo@empresa.com':'correo@ejemplo.com'} autoComplete="email" required maxLength={254}/></div></FormField>
 <FormField id="password" label="Contraseña"><div className="input-with-icon"><DesignIcon name="lock"/><Input id="password" name="password" type="password" placeholder="Crea una contraseña segura" autoComplete="new-password" required minLength={12} maxLength={128} aria-describedby="password-help"/></div><small id="password-help" className="muted">Mínimo 12 caracteres, con letras y números.</small></FormField>
 {role==='COMPANY'&&<><FormField id="coverageArea" label="Zona de Cobertura"><div className="input-with-icon"><DesignIcon name="location"/><Input id="coverageArea" name="coverageArea" placeholder="Ciudad, región o distrito" required minLength={3} maxLength={300}/></div></FormField>
 <div className="field"><label htmlFor="document">Documento de Verificación</label><div className="upload-zone"><DesignIcon name="document"/><p>{documentName||'Sube tu licencia comercial o registro de la empresa'}</p><small>PDF, JPG, PNG o WebP · Hasta 5 MiB</small><Input id="document" name="document" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required onChange={e=>setDocumentName(e.target.files?.[0]?.name||'')}/></div></div></>}
 <Button className="button-amber" type="submit">{busy?'Creando cuenta…':role==='COMPANY'?'Enviar Solicitud':'Registrarse'}<DesignIcon name="arrow-right"/></Button>
 {role==='COMPANY'&&<p className="form-note">Tu solicitud será revisada por el administrador. Mientras tanto, podrás publicar material propio.</p>}
 </fieldset>{error&&<Alert isError>{error}</Alert>}{success&&<Alert>{success} <Link href="/login">Iniciar sesión</Link></Alert>}
 <p className="auth-footer">¿Ya tienes una cuenta? <Link href="/login">Iniciar sesión</Link></p></form>;
}
