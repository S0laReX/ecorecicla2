import type {AvailablePublication} from '../../types/collection';
import {MATERIAL_LABELS} from '../../constants/collectionConstants';
import {CollectionIcon} from '../atoms/CollectionIcon';
import {AcceptPublicationForm} from './AcceptPublicationForm';
export function PublicationDetail({publication:p}:{publication:AvailablePublication}){
 return <><article className="collection-detail panel"><img className="collection-detail-photo" src={p.publicationPhotoDataUrl} alt={`${MATERIAL_LABELS[p.publicationMaterialType]} publicado por ${p.publisherName}`} width={960} height={640}/><div className="collection-detail-body"><span className="badge badge-disponible">Disponible</span><h1>{MATERIAL_LABELS[p.publicationMaterialType]} para recolectar</h1><p className="collection-detail-publisher"><CollectionIcon name="person"/> Publicado por {p.publisherName}</p><dl><dt>Tipo de material</dt><dd>{MATERIAL_LABELS[p.publicationMaterialType]}</dd><dt>Cantidad</dt><dd>{p.publicationQuantityKg} kg</dd><dt>Ubicación</dt><dd>{p.publicationLocationText}</dd><dt>Horario disponible</dt><dd>{p.publicationAvailabilityText}</dd></dl></div></article><AcceptPublicationForm publicationUUID={p.publicationUUID} availabilityText={p.publicationAvailabilityText}/></>;
}
