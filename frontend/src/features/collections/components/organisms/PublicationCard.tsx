import Link from 'next/link';
import type {AvailablePublication} from '../../types/collection';
import {MATERIAL_LABELS} from '../../constants/collectionConstants';
import {CollectionIcon} from '../atoms/CollectionIcon';
export function PublicationCard({publication:p}:{publication:AvailablePublication}){
 return <article className="collection-card"><img className="collection-photo" src={p.publicationPhotoDataUrl} alt={`Material disponible: ${MATERIAL_LABELS[p.publicationMaterialType]}`} width={640} height={400} loading="lazy"/>
 <div className="collection-card-body"><div className="collection-publisher"><span className="collection-avatar"><CollectionIcon name="person"/></span><div><h2>{p.publisherName}</h2><p><CollectionIcon name="location"/>{p.publicationLocationText}</p></div></div>
 <span className={`collection-chip material-${p.publicationMaterialType}`}>{MATERIAL_LABELS[p.publicationMaterialType]} · {p.publicationQuantityKg} kg</span>
 <div className="collection-card-footer"><p><CollectionIcon name="clock"/>{p.publicationAvailabilityText}</p><Link href={`/recolecciones/${p.publicationUUID}`} aria-label={`Ver detalle de ${MATERIAL_LABELS[p.publicationMaterialType]} de ${p.publisherName}`}>Ver detalle</Link></div></div></article>;
}
