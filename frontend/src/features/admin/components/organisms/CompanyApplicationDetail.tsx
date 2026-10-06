'use client';
import {useEffect,useState} from 'react';
import {fetchCompanyVerificationDocument} from '../../services/companyApplicationService';
import type {CompanyApplication} from '../../types/companyApplication';
export function CompanyApplicationDetail({company,onApprove,onReject,saving}:{company:CompanyApplication;onApprove:()=>void;onReject:()=>void;saving:boolean}){
 const [documentURL,setDocumentURL]=useState('');const [documentType,setDocumentType]=useState('');const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 useEffect(()=>{let active=true;let objectURL='';setLoading(true);setError('');setDocumentURL('');
  void fetchCompanyVerificationDocument(company.companyUUID).then(({blob,contentType})=>{if(!active)return;objectURL=URL.createObjectURL(blob);setDocumentURL(objectURL);setDocumentType(contentType);}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'No se pudo abrir el documento.');}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;if(objectURL)URL.revokeObjectURL(objectURL);};
 },[company.companyUUID]);
 return <aside className="company-application-detail" aria-labelledby="application-detail-title">
  <div className="company-detail-cover"><span className="company-request-mark" aria-hidden="true">{company.companyName.trim().charAt(0).toLocaleUpperCase('es-BO')}</span></div>
  <div className="company-detail-content"><div className="company-detail-heading"><div><p className="eyebrow">Solicitud de verificación</p><h2 id="application-detail-title">{company.companyName}</h2></div><span className="company-detail-dot" aria-hidden="true"/></div>
   <dl className="company-detail-info"><div><dt>RUC/NIT</dt><dd>{company.companyTaxIdentifier}</dd></div><div><dt>Contacto</dt><dd>{company.companyContactName}</dd></div><div><dt>Correo</dt><dd><a href={`mailto:${company.companyEmail}`}>{company.companyEmail}</a></dd></div><div><dt>Zona de cobertura</dt><dd>{company.companyCoverageArea}</dd></div><div><dt>Registrada</dt><dd><time dateTime={company.companyCreatedAt}>{new Intl.DateTimeFormat('es-BO',{dateStyle:'long',timeZone:'UTC'}).format(new Date(company.companyCreatedAt))}</time></dd></div></dl>
   <section className="verification-document" aria-labelledby="verification-document-title"><div className="verification-document-heading"><h3 id="verification-document-title">Documento de verificación</h3><span aria-hidden="true">PDF / JPG</span></div>
    {loading?<p role="status">Cargando documento…</p>:error?<p role="alert" className="document-error">{error}</p>:documentType==='application/pdf'?<iframe className="verification-document-frame" src={documentURL} title={`Documento de verificación de ${company.companyName}`} sandbox="allow-scripts"/>:<img className="verification-document-image" src={documentURL} alt={`Documento de verificación de ${company.companyName}`}/>}
    {documentURL&&<a className="text-link document-open-link" href={documentURL} target="_blank" rel="noreferrer">Abrir documento en otra pestaña</a>}
   </section>
   <div className="company-decision-actions"><button className="button button-danger" type="button" disabled={saving||loading||!!error} onClick={onReject}>Rechazar solicitud</button><button className="button" type="button" disabled={saving||loading||!!error} onClick={onApprove}>Aprobar empresa</button></div>
  </div>
 </aside>;
}
