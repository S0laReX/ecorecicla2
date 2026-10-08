'use client';
import {CollectionsTemplate} from '../components/templates/CollectionsTemplate';
import {MaterialFilter} from '../components/molecules/MaterialFilter';
import {PublicationCard} from '../components/organisms/PublicationCard';
import {useAvailablePublications} from '../hooks/useAvailablePublications';
import {Button} from '../../../shared/components/atoms/Button';
import {Alert} from '../../../shared/components/molecules/Alert';
import {COLLECTION_PAGE_SIZE} from '../constants/collectionConstants';
function AvailableContent(){
 const {filter,items,total,status,error,setMaterial,setPage,refresh}=useAvailablePublications();
 const pages=Math.max(1,Math.ceil(total/COLLECTION_PAGE_SIZE));const busy=status==='loading'||status==='idle';
 return <><header className="collection-heading"><p className="eyebrow">EMPRESA VERIFICADA</p><h1>Explorar recolecciones</h1><p>Encuentra materiales disponibles y consulta dónde y cuándo recogerlos.</p></header>
 <MaterialFilter value={filter.materialType} onChange={setMaterial}/>
 <div className="collection-results-heading"><div><h2>Publicaciones disponibles</h2><p role="status" aria-live="polite">{busy?'Buscando materiales…':status==='ready'?`${total} ${total===1?'publicación disponible':'publicaciones disponibles'}`:'No se pudo actualizar el listado.'}</p></div><Button className="button-secondary" disabled={busy} onClick={refresh}>Actualizar</Button></div>
 {error&&<Alert isError>{error}</Alert>}
 {!busy&&status==='ready'&&(items.length?<div className="collection-grid">{items.map(p=><PublicationCard key={p.publicationUUID} publication={p}/>)}</div>:<div className="panel collection-empty"><h3>No hay publicaciones disponibles</h3><p>{filter.materialType?'Prueba con otro material o limpia el filtro.':'Cuando alguien publique material disponible, aparecerá aquí.'}</p>{filter.materialType&&<Button onClick={()=>setMaterial('')}>Ver todos los materiales</Button>}{filter.page>1&&<Button onClick={()=>setPage(1)}>Volver a la primera página</Button>}</div>)}
 {status==='ready'&&(pages>1||filter.page>1)&&<nav className="pagination" aria-label="Páginas de publicaciones"><Button disabled={filter.page<=1} onClick={()=>setPage(filter.page-1)}>Anterior</Button><span>Página {filter.page} · {total} resultados</span><Button disabled={filter.page>=pages} onClick={()=>setPage(filter.page+1)}>Siguiente</Button></nav>}
 </>;
}
export function AvailablePublicationsPage(){return <CollectionsTemplate><AvailableContent/></CollectionsTemplate>;}
