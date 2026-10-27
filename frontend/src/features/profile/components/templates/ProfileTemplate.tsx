'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useProfile} from '../../hooks/useProfile';
import {ProfileSummary} from '../organisms/ProfileSummary';
import {ProfileEditor} from '../organisms/ProfileEditor';
import {CollectionHistory} from '../organisms/CollectionHistory';
import {Button} from '../../../../shared/components/atoms/Button';
import {Alert} from '../../../../shared/components/molecules/Alert';
export function ProfileTemplate(){const state=useProfile();const [editing,setEditing]=useState(false);const [notice,setNotice]=useState('');
 if(state.loading)return <p role="status">Cargando perfil…</p>;
 if(state.error||!state.data)return <><Alert isError>{state.error||'No se pudo cargar el perfil.'}</Alert><Button onClick={state.retry}>Reintentar perfil</Button></>;
 const {profile,summary}=state.data;
 return <div className="profile-page"><header className="profile-identity"><p className="eyebrow">{profile.roleCode==='COMPANY'?'PERFIL DE EMPRESA':'MI PERFIL'}</p><h1>{profile.displayName}</h1><p>{profile.email}</p>{profile.roleCode==='COMPANY'&&<p className="profile-verification">{profile.verificationStatus==='APPROVED'?'Empresa verificada':'Verificación pendiente'}</p>}</header>
 <ProfileSummary summary={summary}/>{notice&&<Alert>{notice}</Alert>}
 <div className="profile-detail-grid"><section className="profile-details" aria-label="Datos de mi perfil"><h2>Datos de contacto</h2><dl><dt>Contacto</dt><dd>{profile.contact||'Sin contacto registrado'}</dd><dt>Dirección o zona</dt><dd>{profile.address||'Sin dirección registrada'}</dd></dl><Button className="button-secondary" onClick={()=>{setEditing(true);setNotice('');}}>Editar perfil</Button><Link href="/calificaciones">Ver calificaciones pendientes</Link></section>
 {editing&&<ProfileEditor profile={profile} onCancel={()=>setEditing(false)} onSaved={updated=>{state.setData({profile:updated,summary});setEditing(false);setNotice('Perfil actualizado.');}}/>}</div>
 <CollectionHistory/>
 </div>;
}
