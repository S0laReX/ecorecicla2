'use client';
import {CollectionsTemplate} from '../components/templates/CollectionsTemplate';
import {AgendaItem} from '../components/organisms/AgendaItem';
import {useAgenda} from '../hooks/useAgenda';
import {Button} from '../../../shared/components/atoms/Button';
import {Alert} from '../../../shared/components/molecules/Alert';
import Link from 'next/link';
function AgendaContent(){
 const {items,total,page,limit,status,error,cancellingUUID,confirmingUUID,confirmation,setPage,refresh,cancel,confirm}=useAgenda();const busy=status==='loading';const pageCount=Math.max(1,Math.ceil(total/limit));
 return <section className="agenda-page">
  <header className="collection-heading"><p className="eyebrow">EMPRESA RECOLECTORA</p><h1>Agenda de recolecciones</h1><p>Organiza los materiales que aceptaste y consulta la fecha, hora y ubicación acordadas.</p></header>
  <div className="collection-results-heading"><div><h2>Recolecciones aceptadas</h2><p aria-live="polite">{busy?'Cargando agenda…':`${total} ${total===1?'recolección agendada':'recolecciones agendadas'}`}</p></div><Button className="button-secondary" disabled={busy} onClick={()=>void refresh()}>Actualizar agenda</Button></div>
  {confirmation&&<Alert>Recolección confirmada. Tu empresa recibió {confirmation.collectorPoints} puntos y el publicador recibió {confirmation.publisherPoints} puntos.</Alert>}
  {error&&<Alert isError>{error}</Alert>}
  {status==='error'&&<Button onClick={()=>void refresh()}>Reintentar</Button>}
  {status==='ready'&&!items.length&&<div className="panel collection-empty"><h2>Tu agenda está vacía</h2><p>Cuando aceptes una publicación, podrás coordinarla y administrarla aquí.</p><Link className="button" href="/recolecciones">Explorar materiales</Link></div>}
  {status==='ready'&&items.length>0&&<div className="agenda-grid" aria-busy={busy}>{items.map(reservation=><AgendaItem key={reservation.reservationUUID} reservation={reservation} isCancelling={cancellingUUID===reservation.reservationUUID} onCancel={cancel} onConfirm={confirm} isConfirming={confirmingUUID===reservation.reservationUUID} disabled={!!cancellingUUID||!!confirmingUUID}/>)}</div>}
  {status==='ready'&&(pageCount>1||page>1)&&<nav className="pagination" aria-label="Páginas de la agenda"><Button className="button-secondary" disabled={page<=1||busy} onClick={()=>setPage(page-1)}>Anterior</Button><span>Página {page} de {pageCount}</span><Button className="button-secondary" disabled={page>=pageCount||busy} onClick={()=>setPage(page+1)}>Siguiente</Button></nav>}
 </section>;
}

export function AgendaPage(){return <CollectionsTemplate><AgendaContent/></CollectionsTemplate>;}
