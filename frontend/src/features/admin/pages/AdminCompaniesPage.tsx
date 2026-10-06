'use client';
import {RequireSession} from '../../auth/components/templates/RequireSession';
import {AdminCompaniesTemplate} from '../components/templates/AdminCompaniesTemplate';
export function AdminCompaniesPage(){return <RequireSession roles={['ADMIN']}><AdminCompaniesTemplate/></RequireSession>;}
