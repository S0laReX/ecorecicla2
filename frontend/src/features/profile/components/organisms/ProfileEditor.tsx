'use client';
import {useState,type FormEvent} from 'react';
import {useDispatch} from 'react-redux';
import {useAuth} from '../../../auth/hooks/useAuth';
import {setUser} from '../../../auth/store/authSlice';
import {profileInputSchema,type Profile} from '../../schemas/profileSchema';
import {updateProfile} from '../../services/profileService';
import {Button} from '../../../../shared/components/atoms/Button';
import {Input} from '../../../../shared/components/atoms/Input';
import {FormField} from '../../../../shared/components/molecules/FormField';
import {Alert} from '../../../../shared/components/molecules/Alert';
export function ProfileEditor({profile,onSaved,onCancel}:{profile:Profile;onSaved:(value:Profile)=>void;onCancel:()=>void}){
 const [name,setName]=useState(profile.displayName);const [contact,setContact]=useState(profile.contact);const [address,setAddress]=useState(profile.address);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const {user}=useAuth();const dispatch=useDispatch();
 async function submit(event:FormEvent){event.preventDefault();if(busy)return;setError('');const parsed=profileInputSchema.safeParse({displayName:name,contact,address});if(!parsed.success){setError('Escribe un nombre de 2 a 120 caracteres, contacto de hasta 120 y dirección de hasta 300.');return;}
  setBusy(true);try{const updated=await updateProfile(parsed.data);if(user)dispatch(setUser({...user,displayName:updated.displayName}));onSaved(updated);}catch(cause){setError(cause instanceof Error?cause.message:'No se pudo guardar el perfil.');}finally{setBusy(false);}
 }
 return <form className="profile-editor" onSubmit={submit}><h2>Editar perfil</h2><FormField id="profile-name" label={profile.roleCode==='COMPANY'?'Nombre de la empresa':'Nombre'}><Input id="profile-name" required minLength={2} maxLength={120} autoComplete="name" disabled={busy} value={name} onChange={e=>setName(e.target.value)}/></FormField>
 <FormField id="profile-contact" label="Contacto"><Input id="profile-contact" maxLength={120} disabled={busy} value={contact} onChange={e=>setContact(e.target.value)} placeholder="Teléfono u otro dato de contacto"/></FormField>
 <FormField id="profile-address" label="Dirección o zona"><Input id="profile-address" maxLength={300} autoComplete="street-address" disabled={busy} value={address} onChange={e=>setAddress(e.target.value)}/></FormField>
 <p>Contacto y dirección son opcionales. El correo de acceso se conserva.</p>{error&&<Alert isError>{error}</Alert>}<div className="actions"><Button type="submit" disabled={busy}>{busy?'Guardando…':'Guardar perfil'}</Button><Button className="button-secondary" disabled={busy} onClick={onCancel}>Cancelar</Button></div></form>;
}
