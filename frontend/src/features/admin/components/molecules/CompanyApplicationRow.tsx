import {VerificationStatusBadge} from '../atoms/VerificationStatusBadge';
import type {CompanyApplication} from '../../types/companyApplication';
export function CompanyApplicationRow({company,selected,onSelect}:{company:CompanyApplication;selected:boolean;onSelect:()=>void}){
 const submitted=new Intl.DateTimeFormat('es-BO',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(company.companyCreatedAt));
 return <li className="company-request-item"><button type="button" className={`company-request-row${selected?' is-selected':''}`} aria-pressed={selected} onClick={onSelect}>
  <span className="company-request-mark" aria-hidden="true">{company.companyName.trim().charAt(0).toLocaleUpperCase('es-BO')}</span>
  <span className="company-request-main"><strong>{company.companyName}</strong><small>RUC/NIT {company.companyTaxIdentifier}</small><small>{company.companyCoverageArea}</small></span>
  <span className="company-request-date"><small>Solicitud recibida</small><time dateTime={company.companyCreatedAt}>{submitted}</time></span>
  <VerificationStatusBadge/>
 </button></li>;
}
