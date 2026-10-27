import type {AccountStatus} from '../../types/managedAccount';
const labels:Record<AccountStatus,string>={ACTIVE:'Activo',PENDING:'Pendiente',APPROVED:'Aprobada',REJECTED:'Rechazada',SUSPENDED:'Suspendida'};
export function AccountStatusBadge({status}:{status:AccountStatus}){return <span className={`account-status-badge status-${status.toLowerCase()}`}>{labels[status]}</span>;}
