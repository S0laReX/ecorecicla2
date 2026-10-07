'use client';
import {useRef,type ReactNode} from 'react';
import {Provider} from 'react-redux';
import {makeStore,type AppStore} from './store';
import {SessionBootstrap} from '../features/auth/components/organisms/SessionBootstrap';
export function StoreProvider({children}:{children:ReactNode}) {
 const ref = useRef<AppStore|null>(null);
 if(!ref.current)ref.current=makeStore();
 return <Provider store={ref.current}><SessionBootstrap/>{children}</Provider>;
}
