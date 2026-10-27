import {MATERIAL_LABELS} from '../../../publications/constants/publicationConstants';
import type {History} from '../../schemas/profileSchema';
export const STATUS_LABELS={ACEPTADA:'Aceptada',CONFIRMADA:'Confirmada',CANCELADA:'Cancelada',VENCIDA:'Vencida'};
const dateFormat=new Intl.DateTimeFormat('es-BO',{dateStyle:'medium',timeStyle:'short',timeZone:'America/La_Paz'});
export function HistoryCard({item}:{item:History['data'][number]}){return <li className="profile-history-card">
 <div><h3>{MATERIAL_LABELS[item.materialType]} · {item.quantityKg} kg</h3><p><time dateTime={item.date}>{dateFormat.format(new Date(item.date))}</time></p><span className={`history-status history-${item.status.toLowerCase()}`}>{STATUS_LABELS[item.status]}</span></div>
 <p className="profile-history-points"><strong>{item.points} pts</strong><span>Para tu cuenta</span></p>
</li>;}
