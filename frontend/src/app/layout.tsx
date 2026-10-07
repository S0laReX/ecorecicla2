import type {ReactNode} from 'react';
import {StoreProvider} from '../store/Provider';
import './globals.css';
import {AppShell} from '../shared/components/templates/AppShell';
export default function RootLayout({children}:{children:ReactNode}) {
 return <html lang="es"><body><StoreProvider><AppShell>{children}</AppShell></StoreProvider></body></html>;
}
