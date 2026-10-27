'use client';
import {RequireSession} from '../../auth/components/templates/RequireSession';
import {AdminPointsTemplate} from '../components/templates/AdminPointsTemplate';
export function AdminPointsPage(){return <RequireSession roles={['ADMIN']}><AdminPointsTemplate/></RequireSession>;}
