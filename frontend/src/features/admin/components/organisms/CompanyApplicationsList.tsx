import {CompanyApplicationRow} from '../molecules/CompanyApplicationRow';
import type {CompanyApplication} from '../../types/companyApplication';
export function CompanyApplicationsList({companies,selectedUUID,onSelect}:{companies:CompanyApplication[];selectedUUID?:string;onSelect:(company:CompanyApplication)=>void}){
 if(!companies.length)return <div className="company-applications-empty"><span className="icon-circle lavender" aria-hidden="true">✓</span><h2>No hay solicitudes pendientes</h2><p>Cuando una empresa solicite verificación, aparecerá aquí para su revisión.</p></div>;
 return <ul className="company-applications-list" aria-label="Solicitudes de empresas">
  {companies.map(company=><CompanyApplicationRow key={company.companyUUID} company={company} selected={company.companyUUID===selectedUUID} onSelect={()=>onSelect(company)}/>)}
 </ul>;
}
