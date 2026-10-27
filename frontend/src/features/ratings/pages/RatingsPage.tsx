'use client';
import {useState} from 'react';
import Link from 'next/link';
import {RequireSession} from '../../auth/components/templates/RequireSession';
import {Button} from '../../../shared/components/atoms/Button';
import {Alert} from '../../../shared/components/molecules/Alert';
import {Modal} from '../../../shared/components/molecules/Modal';
import {StarRating} from '../components/atoms/StarRating';
import {RatingSummary} from '../components/molecules/RatingSummary';
import {PendingRatingCard} from '../components/organisms/PendingRatingCard';
import {RatingsTemplate} from '../components/templates/RatingsTemplate';
import {useRatings} from '../hooks/useRatings';
import type {PendingRating} from '../types/rating';
function RatingsContent(){
 const {items,profile,status,error,submitting,refresh,rate}=useRatings();const [selected,setSelected]=useState<PendingRating|null>(null);const [score,setScore]=useState<number|null>(null);const [saved,setSaved]=useState(false);
 async function submit(){if(!selected||score===null)return;const ok=await rate(selected.reservationUUID,score);if(ok){setSaved(true);setSelected(null);setScore(null);}}
 return <RatingsTemplate><header className="ratings-heading"><p className="eyebrow">RECONOCER UNA BUENA RECOLECCIÓN</p><h1>Calificaciones</h1><p>Después de una recolección confirmada, puedes dejar una calificación de una a cinco estrellas para la otra parte.</p></header>
 {profile&&<RatingSummary average={profile.average} count={profile.count} title="Tu calificación de perfil"/>}
 {saved&&<Alert>Gracias. Tu calificación se guardó y el promedio del perfil se actualizó.</Alert>}{error&&<Alert isError>{error}</Alert>}
 <div className="rating-list-heading"><div><h2>Recolecciones pendientes de calificar</h2><p>{status==='loading'?'Cargando…':`${items.length} ${items.length===1?'pendiente':'pendientes'}`}</p></div><Button className="button-secondary" disabled={status==='loading'} onClick={()=>void refresh()}>Actualizar</Button></div>
 {status==='loading'&&<p className="panel" role="status">Cargando tus recolecciones confirmadas…</p>}{status==='error'&&<Button onClick={()=>void refresh()}>Reintentar</Button>}
 {status==='ready'&&!items.length&&<div className="panel rating-empty"><span className="icon-circle lavender" aria-hidden="true">★</span><h2>No tienes calificaciones pendientes</h2><p>Cuando una recolección confirmada esté lista para calificar, aparecerá aquí.</p><Link className="button button-secondary" href="/perfil">Ver mi perfil</Link></div>}
 {status==='ready'&&items.length>0&&<div className="pending-rating-grid">{items.map(item=><PendingRatingCard key={item.reservationUUID} item={item} disabled={submitting} onRate={()=>{setSaved(false);setScore(null);setSelected(item);}}/>)}</div>}
 <Modal open={!!selected} title="¿Cómo fue esta recolección?" onClose={()=>{if(!submitting)setSelected(null);}}><div className="rating-modal-content"><p>Califica a <strong>{selected?.ratedDisplayName}</strong>. Tu opinión se registra como estrellas y no incluye comentarios.</p><StarRating value={score} onChange={setScore} label="Elige de una a cinco estrellas"/><p className="rating-score-hint" aria-live="polite">{score===null?'Selecciona una calificación':`${score} ${score===1?'estrella':'estrellas'}`}</p>{error&&<Alert isError>{error}</Alert>}<div className="actions rating-modal-actions"><Button disabled={submitting||score===null} onClick={()=>void submit()}>{submitting?'Guardando…':'Enviar calificación'}</Button><Button className="button-secondary" disabled={submitting} onClick={()=>setSelected(null)}>Cancelar</Button></div></div></Modal>
 </RatingsTemplate>;
}
export function RatingsPage(){return <RequireSession roles={['USER','COMPANY']} allowPending={false}><RatingsContent/></RequireSession>;}
