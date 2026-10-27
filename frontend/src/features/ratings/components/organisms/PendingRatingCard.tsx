import {MATERIAL_LABELS} from '../../../collections/constants/collectionConstants';
import type {PendingRating} from '../../types/rating';
import {StarRating} from '../atoms/StarRating';
import {Button} from '../../../../shared/components/atoms/Button';
export function PendingRatingCard({item,onRate,disabled}:{item:PendingRating;onRate:()=>void;disabled:boolean}){
 const date=new Date(item.confirmedAt);
 return <article className="pending-rating-card panel"><div className="pending-rating-heading"><div><p className="eyebrow">RECOLECCIÓN CONFIRMADA</p><h2>{MATERIAL_LABELS[item.materialType]||item.materialType}</h2></div><time dateTime={item.confirmedAt}>{new Intl.DateTimeFormat('es-BO',{dateStyle:'medium',timeStyle:'short',timeZone:'America/La_Paz'}).format(date)}</time></div>
 <dl className="pending-rating-details"><div><dt>Calificar a</dt><dd>{item.ratedDisplayName}</dd></div><div><dt>Cantidad recolectada</dt><dd>{item.quantityKg} kg</dd></div></dl>
 <div className="rating-counterparty"><span>Promedio actual</span><StarRating value={item.ratedAverage} readOnly/><small>{item.ratedCount===0?'Sin calificaciones previas':`${item.ratedCount} ${item.ratedCount===1?'opinión':'opiniones'}`}</small></div>
 <Button className="pending-rating-action" disabled={disabled} onClick={onRate}>Calificar a esta parte</Button></article>;
}
