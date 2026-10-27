import {ManagedAccountRow} from '../molecules/ManagedAccountRow';
import type {ManagedAccount} from '../../types/managedAccount';
export function ManagedAccountsList({accounts,disabled,onToggle}:{accounts:ManagedAccount[];disabled:boolean;onToggle:(account:ManagedAccount,nextStatus:'ACTIVE'|'SUSPENDED')=>void}){
 if(!accounts.length)return <div className="company-applications-empty"><span className="icon-circle lavender" aria-hidden="true">✓</span><h2>No hay cuentas para mostrar</h2><p>Prueba otro estado o cambia el texto de búsqueda.</p></div>;
 return <ul className="managed-accounts-list" aria-label="Cuentas de usuarios y empresas">{accounts.map(account=><ManagedAccountRow key={account.userUUID} account={account} disabled={disabled} onToggle={onToggle}/>)}</ul>;
}
