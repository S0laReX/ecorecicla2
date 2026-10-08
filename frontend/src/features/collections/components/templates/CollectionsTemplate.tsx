import type {ReactNode} from 'react';
import {RequireSession} from '../../../auth/components/templates/RequireSession';
export function CollectionsTemplate({children}:{children:ReactNode}){
 return <RequireSession roles={['COMPANY']} allowPending={false}><section className="collections-page">{children}</section></RequireSession>;
}
