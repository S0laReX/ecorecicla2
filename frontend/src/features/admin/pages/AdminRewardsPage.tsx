'use client';
import {RequireSession} from '../../auth/components/templates/RequireSession';
import {AdminRewardsTemplate} from '../components/templates/AdminRewardsTemplate';
export function AdminRewardsPage(){return <RequireSession roles={['ADMIN']}><AdminRewardsTemplate/></RequireSession>;}
