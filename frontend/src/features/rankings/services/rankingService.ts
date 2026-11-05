import {authenticatedRequest} from '../../auth/services/sessionService';
import {rankingSchema} from '../schemas/rankingSchema';
export async function fetchRanking(month:string,page:number){return rankingSchema.parse(await authenticatedRequest(`/rankings/companies?month=${encodeURIComponent(month)}&page=${page}&limit=20`));}
