import {z} from 'zod';
import {userSchema} from '../../auth/types/auth';
export const noticeSchema=z.object({noticeUUID:z.string().uuid(),kind:z.enum(['ACCEPTED','CONFIRMED','RATE','APPROVED','REJECTED']),title:z.string(),body:z.string(),createdAt:z.string().datetime(),readAt:z.string().datetime().nullable()});
export const inboxSchema=z.object({data:z.array(noticeSchema),meta:z.object({total:z.number().int().nonnegative(),page:z.number().int().positive(),limit:z.number().int().positive()})});
export const countSchema=z.object({unreadCount:z.number().int().nonnegative(),verificationStatus:userSchema.shape.verificationStatus});
export type Notice=z.infer<typeof noticeSchema>;
export type Inbox=z.infer<typeof inboxSchema>;
export type NoticeFilter='ALL'|'READ'|'UNREAD';
