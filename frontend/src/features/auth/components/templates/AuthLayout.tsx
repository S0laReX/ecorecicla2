import type {ReactNode} from 'react';
import Link from 'next/link';
import {DesignIcon} from '../../../../shared/components/atoms/DesignIcon';

export function AuthLayout({children}:{children:ReactNode}) {
 return <section className="auth-layout">
  <div className="auth-visual"><img className="auth-garden" src="/design/auth-garden-hq.webp" alt="Un entorno verde con estaciones de reciclaje"/><div className="auth-overlay"/>
   <Link className="brand auth-brand" href="/"><DesignIcon name="leaf-white"/>EcoRecicla</Link>
   <div className="auth-visual-copy"><h2>Pequeñas acciones.<br/>Un futuro más verde.</h2><p>Comienza a hacer la diferencia hoy mismo.</p></div>
  </div>
  <div className="auth-content">{children}</div>
 </section>;
}
