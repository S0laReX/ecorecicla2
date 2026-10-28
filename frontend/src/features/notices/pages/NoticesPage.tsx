'use client';
import {RequireSession} from '../../auth/components/templates/RequireSession';
import {NoticeInbox} from '../components/organisms/NoticeInbox';
export function NoticesPage(){return <RequireSession roles={['USER','COMPANY']} allowRejected><NoticeInbox/></RequireSession>;}
