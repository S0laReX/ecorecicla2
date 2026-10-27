import type {Summary} from '../../schemas/profileSchema';
import {SummaryCard} from '../atoms/SummaryCard';
const number=new Intl.NumberFormat('es-BO');
export function ProfileSummary({summary}:{summary:Summary}){return <dl className="profile-summary" aria-label="Resumen de mi actividad">
 <SummaryCard label="Puntos acumulados" value={number.format(summary.totalPoints)}/>
 <SummaryCard label="Calificación promedio" value={summary.averageRating===null?'Sin calificaciones':`${number.format(summary.averageRating)} / 5`} detail={`${summary.ratingCount} calificaciones recibidas`}/>
 <SummaryCard label="Publicaciones activas" value={number.format(summary.activePublications)}/>
 <SummaryCard label="Recolecciones confirmadas" value={number.format(summary.confirmedCollections)}/>
</dl>;}
