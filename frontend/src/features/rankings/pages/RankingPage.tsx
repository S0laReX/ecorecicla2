'use client';
import {RequireSession} from '../../auth/components/templates/RequireSession';
import {RankingTemplate} from '../components/templates/RankingTemplate';
export function RankingPage(){return <RequireSession roles={['COMPANY','ADMIN']} allowPending={false}><RankingTemplate/></RequireSession>;}
