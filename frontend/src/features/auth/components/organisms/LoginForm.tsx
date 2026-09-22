'use client';
import {useState} from 'react';import {useRouter} from 'next/navigation';import Link from 'next/link';
import {useAuth} from '../../hooks/useAuth';import {homeFor} from '../../utils/redirect';
import {Input} from '../../../../shared/components/atoms/Input';import {Button} from '../../../../shared/components/atoms/Button';import {FormField} from '../../../../shared/components/molecules/FormField';import {Alert} from '../../../../shared/components/molecules/Alert';
export function LoginForm(){const auth=useAuth();const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 return <form className="panel auth-form" onSubmit={async event=>{event.preventDefault();if(busy)return;setBusy(true);setError('');const body=new FormData(event.currentTarget);try{const user=await auth.login(String(body.get('email')),String(body.get('password')));router.replace(homeFor(user));}catch(cause){setError(cause instanceof Error?cause.message:'No se pudo iniciar sesión.');}finally{setBusy(false);}}}>
 <fieldset disabled={busy}><legend>Accede a tu cuenta</legend><FormField id="email" label="Correo electrónico"><Input id="email" name="email" type="email" autoComplete="email" required/></FormField>
 <FormField id="password" label="Contraseña"><Input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128}/></FormField><Button type="submit">{busy?'Entrando…':'Iniciar sesión'}</Button></fieldset>
 {(error||auth.error)&&<Alert isError>{error||auth.error}</Alert>}<p><Link href="/recuperar">Olvidé mi contraseña</Link></p><p>¿Primera vez aquí? <Link href="/registro">Crea tu cuenta</Link></p></form>;
}
