'use client';
import {Button} from '../../../../shared/components/atoms/Button';
import {Alert} from '../../../../shared/components/molecules/Alert';
import {useMaterialPoints} from '../../hooks/useMaterialPoints';
import {MaterialPointsList} from '../organisms/MaterialPointsList';
export function AdminPointsTemplate(){
 const state=useMaterialPoints();
 return <section className="admin-companies-page"><div className="admin-workspace">

  <div className="admin-workspace-main"><header className="admin-page-heading"><div><p className="eyebrow">CONFIGURACIÓN</p><h1>Puntos por material</h1><p>Define cuántos puntos recibe cada participante al confirmar una recolección.</p></div></header>
   <p>Los cambios se aplican a las próximas confirmaciones. Los puntos ya otorgados se conservan. Cada material sin configurar otorga 10 puntos al publicador y 10 a la empresa.</p>
   <p className="material-point-help">Valores enteros de 0 a 1 000 000, por recolección confirmada. Guarda cada material por separado.</p>
   {state.loading?<p role="status">Cargando configuración…</p>:state.error?<><Alert isError>{state.error}</Alert><Button onClick={state.retry}>Reintentar</Button></>:<MaterialPointsList items={state.items}/>}
  </div>
 </div></section>;
}
