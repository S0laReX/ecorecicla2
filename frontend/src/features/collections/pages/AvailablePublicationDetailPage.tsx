'use client';
import Link from 'next/link';
import {CollectionsTemplate} from '../components/templates/CollectionsTemplate';
import {PublicationDetail} from '../components/organisms/PublicationDetail';
import {useAvailablePublication} from '../hooks/useAvailablePublication';
import {Alert} from '../../../shared/components/molecules/Alert';
import {Button} from '../../../shared/components/atoms/Button';
function DetailContent({uuid}:{uuid:string}){
 const {publication,status,error,retry}=useAvailablePublication(uuid);
 return <><Link className="collection-back" href="/recolecciones">← Volver a explorar</Link>{status==='loading'||status==='idle'?<p role="status">Cargando detalle…</p>:error?<><Alert isError>{error}</Alert><Button onClick={retry}>Reintentar</Button></>:publication?<PublicationDetail publication={publication}/>:null}</>;
}
export function AvailablePublicationDetailPage({uuid}:{uuid:string}){return <CollectionsTemplate><DetailContent uuid={uuid}/></CollectionsTemplate>;}
