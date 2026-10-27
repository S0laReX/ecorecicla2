'use client';
import {RequireSession} from '../../auth/components/templates/RequireSession';
import {AdminAccountsTemplate} from '../components/templates/AdminAccountsTemplate';
export function AdminAccountsPage(){return <RequireSession roles={['ADMIN']}><AdminAccountsTemplate/></RequireSession>;}
