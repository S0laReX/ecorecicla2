'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useManagedAccounts} from '../../hooks/useManagedAccounts';
import {ManagedAccountsList} from '../organisms/ManagedAccountsList';
import {Modal} from '../../../../shared/components/molecules/Modal';
import {Alert} from '../../../../shared/components/molecules/Alert';
import {Button} from '../../../../shared/components/atoms/Button';
import type {AccountStatusFilter,ManagedAccount} from '../../types/managedAccount';
const statusLabels:Record<AccountStatusFilter,string>={ALL:'Todos los estados',ACTIVE:'Activo',PENDING:'Pendiente',APPROVED:'Aprobada',REJECTED:'Rechazada',SUSPENDED:'Suspendida'};
export function AdminAccountsTemplate(){
 const state=useManagedAccounts();const [selected,setSelected]=useState<ManagedAccount|null>(null);const [nextStatus,setNextStatus]=useState<'ACTIVE'|'SUSPENDED'|null>(null);const [actionError,setActionError]=useState('');
 const totalPages=Math.max(1,Math.ceil(state.total/10));
 const close=()=>{if(state.saving)return;setSelected(null);setNextStatus(null);setActionError('');};
 const confirm=async()=>{if(!selected||!nextStatus)return;try{await state.changeStatus(selected,nextStatus);setSelected(null);setNextStatus(null);setActionError('');}catch(cause){setActionError(cause instanceof Error?cause.message:'No se pudo cambiar el estado.');}};
 return <section className="admin-companies-page admin-accounts-page"><div className="admin-workspace">
  <aside className="admin-side-rail" aria-label="Navegación de administración"><span className="admin-rail-brand">EcoRecicla</span><p>Panel Admin</p><nav><Link href="/admin"><span aria-hidden="true">▦</span>Solicitudes</Link><Link href="/admin/cuentas" aria-current="page"><span aria-hidden="true">♙</span>Cuentas</Link></nav></aside>
  <div className="admin-workspace-main"><header className="admin-page-heading"><div><p className="eyebrow">ADMINISTRACIÓN</p><h1>Gestión de cuentas</h1><p>Consulta usuarios y empresas, y controla el acceso sin borrar su actividad.</p></div><span className="pending-count"><strong>{state.total}</strong><small>cuentas</small></span></header>
   <div className="admin-search-row"><label className="admin-search-field"><span className="sr-only">Buscar por nombre o correo</span><span aria-hidden="true">⌕</span><input type="search" placeholder="Buscar por nombre o correo…" value={state.searchInput} onChange={event=>state.setSearchInput(event.target.value)} maxLength={120}/></label><label className="admin-filter-select-label"><span className="sr-only">Filtrar cuentas por estado</span><select className="admin-filter-select" value={state.status} onChange={event=>{state.setStatus(event.target.value as AccountStatusFilter);state.setPage(1);}}>{(Object.keys(statusLabels) as AccountStatusFilter[]).map(value=><option key={value} value={value}>{statusLabels[value]}</option>)}</select></label></div>
   {state.notice&&<Alert><span className="admin-notice-content">{state.notice}<button type="button" className="notice-dismiss" aria-label="Cerrar aviso" onClick={()=>state.setNotice('')}>×</button></span></Alert>}
   {state.error&&<Alert isError>{state.error}<button type="button" className="inline-retry" onClick={()=>void state.reload()}>Reintentar</button></Alert>}
   <section className="admin-applications-section" aria-labelledby="managed-accounts-title"><div className="admin-section-heading"><div><h2 id="managed-accounts-title">Usuarios y empresas</h2><p>{state.total} cuentas encontradas</p></div><Button className="button-secondary" disabled={state.loading} onClick={()=>void state.reload()}>Actualizar</Button></div>
    {state.loading?<p className="admin-loading" role="status">Cargando cuentas…</p>:<ManagedAccountsList accounts={state.accounts} disabled={state.saving} onToggle={(account,status)=>{setSelected(account);setNextStatus(status);setActionError('');}}/>}
    {!state.loading&&state.total>0&&<nav className="admin-pagination" aria-label="Paginación de cuentas"><span>Mostrando {(state.page-1)*10+1}–{Math.min(state.page*10,state.total)} de {state.total}</span><div><button className="pagination-arrow" type="button" aria-label="Página anterior" disabled={state.page<=1||state.loading} onClick={()=>state.setPage(value=>Math.max(1,value-1))}>‹</button><span aria-current="page">{state.page}</span><button className="pagination-arrow" type="button" aria-label="Página siguiente" disabled={state.page>=totalPages||state.loading} onClick={()=>state.setPage(value=>Math.min(totalPages,value+1))}>›</button></div></nav>}
   </section>
  </div>
 </div>
 <Modal open={!!selected&&!!nextStatus} title={nextStatus==='SUSPENDED'?'Suspender cuenta':'Reactivar cuenta'} onClose={close}>
  <div className="account-status-dialog"><p>{nextStatus==='SUSPENDED'?<>La cuenta de <strong>{selected?.displayName}</strong> perderá acceso en todos sus dispositivos. Sus publicaciones y recolecciones se conservarán.</>:selected?.roleCode==='COMPANY'&&selected.verificationStatus==='REJECTED'?<>Se levantará la suspensión de <strong>{selected.displayName}</strong>, pero la empresa seguirá sin acceso mientras su solicitud permanezca rechazada. Las sesiones anteriores seguirán cerradas.</>:<>La cuenta de <strong>{selected?.displayName}</strong> podrá iniciar sesión nuevamente. Las sesiones anteriores seguirán cerradas.</>}</p>{actionError&&<Alert isError>{actionError}</Alert>}<div className="actions decision-modal-actions"><Button className="button-secondary" disabled={state.saving} onClick={close}>Cancelar</Button><Button className={nextStatus==='SUSPENDED'?'button-danger':''} disabled={state.saving} onClick={()=>void confirm()}>{state.saving?'Guardando…':nextStatus==='SUSPENDED'?'Confirmar suspensión':'Confirmar reactivación'}</Button></div></div>
 </Modal>
 </section>;
}
