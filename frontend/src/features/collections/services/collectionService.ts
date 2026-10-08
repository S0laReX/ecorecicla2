import {authenticatedRequest} from '../../auth/services/sessionService';
import {availablePageSchema,availablePublicationSchema} from '../schemas/collectionSchema';
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
