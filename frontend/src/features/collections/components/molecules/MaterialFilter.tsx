'use client';
import {Button} from '../../../../shared/components/atoms/Button';
import {MATERIAL_TYPES,MATERIAL_LABELS} from '../../constants/collectionConstants';
import type {MaterialFilter as Filter} from '../../types/collection';
import {CollectionIcon} from '../atoms/CollectionIcon';
export function MaterialFilter({value,onChange}:{value:Filter;onChange:(value:Filter)=>void}){
 return <div className="collection-filters"><label className="collection-filter" htmlFor="collection-material"><CollectionIcon name="filter"/><span>Material</span><select id="collection-material" value={value} onChange={event=>onChange(event.target.value as Filter)}><option value="">Todos los materiales</option>{MATERIAL_TYPES.map(type=><option key={type} value={type}>{MATERIAL_LABELS[type]}</option>)}</select></label><Button className="button-secondary" disabled={!value} onClick={()=>onChange('')}>Limpiar filtro</Button></div>;
}
