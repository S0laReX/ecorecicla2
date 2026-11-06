'use client';
import {RequireSession} from '../../auth/components/templates/RequireSession';
import {RewardsTemplate} from '../components/templates/RewardsTemplate';
export function RewardsPage(){return <RequireSession roles={['USER']}><RewardsTemplate/></RequireSession>;}
