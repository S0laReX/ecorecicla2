import type {MaterialPoint} from '../../schemas/materialPointSchema';
import {MaterialPointForm} from '../molecules/MaterialPointForm';
export function MaterialPointsList({items}:{items:MaterialPoint[]}){return <div className="material-point-grid">{items.map(item=><MaterialPointForm key={item.materialType} initial={item}/>)}</div>;}
