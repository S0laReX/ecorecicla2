import type {User} from '../types/auth';
export function homeFor(user:User):string {
 if(user.roleCode==='ADMIN')return '/admin';
 if(user.roleCode==='COMPANY')return user.verificationStatus==='PENDING'?'/cuenta/pendiente':'/empresa';
 return '/dashboard';
}
