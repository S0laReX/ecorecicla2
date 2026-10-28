import {authenticatedRequest} from '../../auth/services/sessionService';
import {inboxSchema,countSchema,type NoticeFilter} from '../schemas/noticeSchema';
export const noticesChanged='ecorecicla-notices-changed';
export async function fetchNotices(status:NoticeFilter,page:number){return inboxSchema.parse(await authenticatedRequest(`/notices?${new URLSearchParams({status,page:String(page),limit:'10'})}`,{},true));}
export async function fetchUnreadCount(){return countSchema.parse(await authenticatedRequest('/notices/unread-count'));}
export async function markNoticeRead(uuid:string){await authenticatedRequest(`/notices/${uuid}/read`,{method:'PATCH'});window.dispatchEvent(new Event(noticesChanged));}
