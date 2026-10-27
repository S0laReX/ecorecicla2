import {Button} from '../../../../shared/components/atoms/Button';
import {AccountStatusBadge} from '../atoms/AccountStatusBadge';
import type {ManagedAccount} from '../../types/managedAccount';
export function ManagedAccountRow({account,disabled,onToggle}:{account:ManagedAccount;disabled:boolean;onToggle:(account:ManagedAccount,nextStatus:'ACTIVE'|'SUSPENDED')=>void}){
 const isCompany=account.roleCode==='COMPANY';const verifiedLabel={NOT_REQUIRED:'No aplica',PENDING:'Verificación pendiente',APPROVED:'Empresa aprobada',REJECTED:'Empresa rechazada'}[account.verificationStatus];
 const updated=new Intl.DateTimeFormat('es-BO',{dateStyle:'medium'}).format(new Date(account.updatedAt));
 return <li className="managed-account-item"><article className="managed-account-row">
  <span className="managed-account-mark" aria-hidden="true">{account.displayName.trim().charAt(0).toLocaleUpperCase('es-BO')}</span>
  <div className="managed-account-main"><strong>{account.displayName}</strong><span>{account.email}</span><small>{isCompany?'Empresa recolectora':'Usuario'} · {verifiedLabel}</small></div>
  <div className="managed-account-state"><AccountStatusBadge status={account.status}/><time dateTime={account.updatedAt}>Actualizada {updated}</time></div>
  <Button className={account.accountStatus==='SUSPENDED'?'button-secondary account-action':'button-danger account-action'} disabled={disabled} onClick={()=>onToggle(account,account.accountStatus==='SUSPENDED'?'ACTIVE':'SUSPENDED')}>{account.accountStatus==='SUSPENDED'?'Reactivar':'Suspender'}</Button>
 </article></li>;
}
