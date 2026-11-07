'use client';
import {useState} from 'react';
import {useCompanyApplications} from '../../hooks/useCompanyApplications';
import {CompanyApplicationsList} from '../organisms/CompanyApplicationsList';
import {CompanyApplicationDetail} from '../organisms/CompanyApplicationDetail';
import {Modal} from '../../../../shared/components/molecules/Modal';
import {Alert} from '../../../../shared/components/molecules/Alert';
import {rejectionReasonSchema} from '../../schemas/companyApplicationSchema';
export function AdminCompaniesTemplate(){
 const state=useCompanyApplications();const [decision,setDecision]=useState<'APPROVED'|'REJECTED'|null>(null);const [reason,setReason]=useState('');const [reasonError,setReasonError]=useState('');const [decisionError,setDecisionError]=useState('');
 const closeDecision=()=>{if(state.saving)return;setDecision(null);setReasonError('');setDecisionError('');};
 const submitDecision=async()=>{if(!state.selected||!decision)return;
  if(decision==='REJECTED'){const parsed=rejectionReasonSchema.safeParse(reason);if(!parsed.success){setReasonError(parsed.error.issues[0]?.message||'Escribe el motivo del rechazo.');return;}}
  try{await state.decide(state.selected,decision,decision==='REJECTED'?reason.trim():undefined);setDecision(null);setReason('');setReasonError('');}
  catch(cause){setDecisionError(cause instanceof Error?cause.message:'No se pudo registrar la decisión.');}
 };
 const totalPages=Math.max(1,Math.ceil(state.meta.total/state.meta.limit));
 return <section className="admin-companies-page">
  <div className="admin-workspace">
   <div className="admin-workspace-main"><header className="admin-page-heading"><div><p className="eyebrow">ADMINISTRACIÓN</p><h1>Gestión de compañías</h1><p>Revisa los documentos y verifica las solicitudes de empresas recolectoras.</p></div><span className="pending-count"><strong>{state.error?'—':state.meta.total}</strong><small>pendientes</small></span></header>
    <div className="admin-search-row"><label className="admin-search-field"><span className="sr-only">Buscar empresa por nombre o RUC/NIT</span><span aria-hidden="true">⌕</span><input type="search" placeholder="Buscar por nombre o RUC/NIT…" value={state.searchInput} onChange={event=>state.setSearchInput(event.target.value)} maxLength={120}/></label><span className="admin-filter-chip">Estado: Pendiente</span></div>
    {state.notice&&<Alert><span className="admin-notice-content">{state.notice}<button type="button" className="notice-dismiss" aria-label="Cerrar aviso" onClick={()=>state.setNotice('')}>×</button></span></Alert>}
    {state.error&&<Alert isError>{state.error}<button type="button" className="inline-retry" onClick={()=>void state.reload()}>Reintentar</button></Alert>}
    <div className={`admin-review-layout${state.selected?' has-selection':''}`}><section className="admin-applications-section" aria-labelledby="pending-applications-title"><div className="admin-section-heading"><div><h2 id="pending-applications-title">Solicitudes pendientes</h2><p>{state.error?'No se pudo consultar el total de solicitudes.':`${state.meta.total} empresas esperan verificación`}</p></div></div>
     {state.loading?<p className="admin-loading" role="status">Cargando solicitudes…</p>:!state.error&&<CompanyApplicationsList companies={state.companies} selectedUUID={state.selected?.companyUUID} onSelect={state.setSelected}/>}
     {!state.loading&&!state.error&&state.meta.total>0&&<nav className="admin-pagination" aria-label="Paginación de solicitudes"><span>Mostrando {state.companies.length?((state.page-1)*state.meta.limit+1):0}–{Math.min(state.page*state.meta.limit,state.meta.total)} de {state.meta.total}</span><div><button className="pagination-arrow" type="button" aria-label="Página anterior" disabled={state.page<=1||state.loading} onClick={()=>state.setPage(value=>Math.max(1,value-1))}>‹</button><span aria-current="page">{state.page}</span><button className="pagination-arrow" type="button" aria-label="Página siguiente" disabled={state.page>=totalPages||state.loading} onClick={()=>state.setPage(value=>Math.min(totalPages,value+1))}>›</button></div></nav>}
    </section>
    {state.selected&&<CompanyApplicationDetail company={state.selected} onApprove={()=>{setReason('');setDecisionError('');setDecision('APPROVED');}} onReject={()=>{setReason('');setReasonError('');setDecisionError('');setDecision('REJECTED');}} saving={state.saving}/>}
    </div>
   </div>
  </div>
  <Modal open={decision!==null} title={decision==='APPROVED'?'Confirmar aprobación':'Rechazar solicitud'} onClose={closeDecision}>
   {decision==='APPROVED'?<p>La empresa <strong>{state.selected?.companyName}</strong> podrá explorar y aceptar recolecciones después de aprobarla.</p>:<div className="field decision-reason-field"><label htmlFor="company-rejection-reason">Motivo breve del rechazo</label><textarea id="company-rejection-reason" rows={4} maxLength={300} value={reason} aria-invalid={!!reasonError} aria-describedby={reasonError?'company-rejection-reason-error':undefined} onChange={event=>{setReason(event.target.value);setReasonError('');}} placeholder="Explica qué debe corregir la empresa…"/><small>{reason.trim().length}/300 caracteres</small>{reasonError&&<p id="company-rejection-reason-error" className="decision-inline-error">{reasonError}</p>}</div>}
   {decisionError&&<Alert isError>{decisionError}</Alert>}<div className="actions decision-modal-actions"><button type="button" className="button button-secondary" disabled={state.saving} onClick={closeDecision}>Volver</button><button type="button" className={`button ${decision==='REJECTED'?'button-danger':''}`} disabled={state.saving} onClick={()=>void submitDecision()}>{state.saving?'Guardando…':decision==='APPROVED'?'Confirmar aprobación':'Confirmar rechazo'}</button></div>
  </Modal>
 </section>;
}
