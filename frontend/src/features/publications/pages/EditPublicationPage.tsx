'use client';
import {useState} from 'react';import {useRouter} from 'next/navigation';import Link from 'next/link';import {useDispatch} from 'react-redux';import {z} from 'zod';
import {usePublication} from '../hooks/usePublication';import {updatePublication} from '../services/publicationService';import {createPublicationSchema} from '../schemas/publicationSchema';import {replacePublication} from '../store/publicationSlice';
import {PublicationForm} from '../components/organisms/PublicationForm';import {RequireSession} from '../../auth/components/templates/RequireSession';import {Alert} from '../../../shared/components/molecules/Alert';import {ApiRequestError} from '../../auth/services/sessionService';
const editSchema=createPublicationSchema.extend({photo:createPublicationSchema.shape.photo.optional()});
function Edit({uuid}:{uuid:string}){const {publication,loading,error,reload}=usePublication(uuid);const [busy,setBusy]=useState(false);const [failure,setFailure]=useState('');const router=useRouter();const dispatch=useDispatch();
 return <section className="publication-editor"><Link className="text-link" href={`/publicaciones/${uuid}`}>← Volver al detalle</Link><h1>Editar publicación</h1>{error&&<Alert isError>{error}</Alert>}{failure&&<Alert isError>{failure}</Alert>}
 {loading?<p role="status">Cargando publicación…</p>:publication&&publication.publicationStatus!=='disponible'?<Alert>Solo puedes editar publicaciones disponibles.</Alert>:publication&&<PublicationForm initial={publication} isSubmitting={busy} onSubmit={async input=>{
  const parsed=editSchema.safeParse(input);if(!parsed.success){setFailure(parsed.error.issues[0].message);return false;}setBusy(true);setFailure('');
  try{const updated=await updatePublication(uuid,parsed.data);dispatch(replacePublication(updated));router.replace(`/publicaciones/${uuid}`);return true;}
  catch(cause){setFailure(cause instanceof Error?cause.message:'No se pudieron guardar los cambios.');if(cause instanceof ApiRequestError&&cause.statusCode===409)await reload();return false;}finally{setBusy(false);}
 }}/>}</section>;
}
export function EditPublicationPage({uuid}:{uuid:string}){return <RequireSession roles={['USER','COMPANY']}><Edit uuid={uuid}/></RequireSession>;}
