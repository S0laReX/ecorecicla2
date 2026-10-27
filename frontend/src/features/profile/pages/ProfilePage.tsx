'use client';
import {RequireSession} from '../../auth/components/templates/RequireSession';
import {ProfileTemplate} from '../components/templates/ProfileTemplate';
export function ProfilePage(){return <RequireSession roles={['USER','COMPANY']}><ProfileTemplate/></RequireSession>;}
