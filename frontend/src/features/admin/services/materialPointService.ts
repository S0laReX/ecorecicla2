import {authenticatedRequest} from '../../auth/services/sessionService';
import {materialPointsResponseSchema,materialPointResponseSchema,type MaterialPoint,type PointValues} from '../schemas/materialPointSchema';
export async function fetchMaterialPoints(){return materialPointsResponseSchema.parse(await authenticatedRequest('/admin/material-points',{},true)).data;}
export async function saveMaterialPoints(material:MaterialPoint['materialType'],values:PointValues){
 return materialPointResponseSchema.parse(await authenticatedRequest(`/admin/material-points/${material}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)},true));
}
