import {decodeApiResponse,fetchApi} from '../../../shared/services/apiResponse';
import {userSchema} from '../types/auth';
export async function registerAccount(body:FormData):Promise<string>{
 const user=userSchema.parse(await decodeApiResponse(await fetchApi('/api/auth/register',{method:'POST',body})));
 return user.roleCode==='COMPANY'?'Empresa registrada. La verificación está pendiente.':'Cuenta creada. Ya puedes iniciar sesión.';
}
