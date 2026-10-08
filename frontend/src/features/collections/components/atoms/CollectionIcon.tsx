export function CollectionIcon({name}:{name:'person'|'location'|'clock'|'filter'}){
 return <img src={`/design/collection-${name}.svg`} alt="" aria-hidden="true" className="design-icon"/>;
}
