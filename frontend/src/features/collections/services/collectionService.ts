import {authenticatedRequest} from '../../auth/services/sessionService';
import {availablePageSchema,availablePublicationSchema} from '../schemas/collectionSchema';
import {acceptedReservationSchema,agendaPageSchema,cancelledReservationSchema} from '../schemas/reservationSchema';
import {COLLECTION_PAGE_SIZE} from '../constants/collectionConstants';
import type {CollectionFilter} from '../types/collection';
export async function listAvailablePublications(filter:CollectionFilter,signal?:AbortSignal){
 const query=new URLSearchParams({page:String(filter.page),limit:String(COLLECTION_PAGE_SIZE)});
 if(filter.materialType)query.set('materialType',filter.materialType);
 return availablePageSchema.parse(await authenticatedRequest(`/collections/publications?${query}`,{signal}));
}
export async function getAvailablePublication(uuid:string,signal?:AbortSignal){
 return availablePublicationSchema.parse(await authenticatedRequest(`/collections/publications/${encodeURIComponent(uuid)}`,{signal}));
}
export async function acceptAvailablePublication(uuid:string,scheduledAt:string){
 return acceptedReservationSchema.parse(await authenticatedRequest(`/collections/publications/${encodeURIComponent(uuid)}/accept`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scheduledAt})}));
}
export async function listAgenda(page=1,signal?:AbortSignal){
 const query=new URLSearchParams({page:String(page),limit:'6'});
 return agendaPageSchema.parse(await authenticatedRequest(`/collections/agenda?${query}`,{signal}));
}
export async function cancelReservation(uuid:string){
 return cancelledReservationSchema.parse(await authenticatedRequest(`/collections/reservations/${encodeURIComponent(uuid)}/cancel`,{method:'POST'}));
}
