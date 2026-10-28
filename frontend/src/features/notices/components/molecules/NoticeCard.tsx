import Link from 'next/link';
import {Button} from '../../../../shared/components/atoms/Button';
import {DesignIcon} from '../../../../shared/components/atoms/DesignIcon';
import type {Notice} from '../../schemas/noticeSchema';
const destinations={ACCEPTED:['/publicaciones','Ver publicaciones'],CONFIRMED:['/perfil','Ver mi perfil'],RATE:['/calificaciones','Calificar'],APPROVED:['/empresa','Ir al inicio'],REJECTED:null} as const;
export function NoticeCard({notice,restricted,busy,onRead}:{notice:Notice;restricted:boolean;busy:boolean;onRead:()=>void}){
 const action=restricted?null:destinations[notice.kind];
 return <article className={`notice-card${notice.readAt?'':' unread'}`}><div className="notice-symbol"><DesignIcon name="leaf-dashboard"/></div><div className="notice-content"><div className="notice-heading"><h2>{notice.title}</h2><span className="notice-state">{notice.readAt?'Leído':'No leído'}</span></div><p>{notice.body}</p><time dateTime={notice.createdAt}>{new Intl.DateTimeFormat('es-BO',{dateStyle:'medium',timeStyle:'short',timeZone:'America/La_Paz'}).format(new Date(notice.createdAt))}</time><div className="notice-actions">{action&&<Link href={action[0]}>{action[1]}</Link>}{!notice.readAt&&<Button className="button-secondary" disabled={busy} onClick={onRead}>{busy?'Guardando…':'Marcar como leído'}</Button>}</div></div></article>;
}
