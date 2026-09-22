import type {ReactNode} from 'react';
import {StoreProvider} from '../store/Provider';
import './globals.css';
export default function RootLayout({children}:{children:ReactNode}) {
 return <html lang="es"><body><header>♻ EcoRecicla</header><main><StoreProvider>{children}</StoreProvider></main><footer>Conectamos materiales con nuevas oportunidades.</footer></body></html>;
}
