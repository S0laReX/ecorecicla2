'use client';
import Link from 'next/link';
import {useCreatePublication} from '../hooks/useCreatePublication';import {RequireSession} from '../../auth/components/templates/RequireSession';
import {Alert} from '../../../shared/components/molecules/Alert';import {PublicationForm} from '../components/organisms/PublicationForm';import {PublicationCard} from '../components/organisms/PublicationCard';
export function CreatePublicationPage(){
 const {submit,fieldErrors,isSubmitting,error,created}=useCreatePublication();
 return <RequireSession roles={['USER','COMPANY']}><section className="publication-editor"><h1>Publicar material reciclable</h1><p className="muted">Agrega los detalles y una foto. Tu publicación quedará disponible para recolección.</p>
 <PublicationForm onSubmit={async input=>!!(await submit(input))} fieldErrors={fieldErrors} isSubmitting={isSubmitting}/>
 {error&&<Alert isError>{error.message}</Alert>}{created&&<><Alert>Tu publicación ya está disponible. <Link href="/publicaciones">Ver mis publicaciones</Link></Alert><div className="publication-grid"><PublicationCard publication={created} isOwner/></div></>}
 </section></RequireSession>;
}
