export function Badge({count}:{count:number|null}){return count!==null&&count>0?<span className="notice-badge" aria-label={`${count} avisos no leídos`}>{count>99?'99+':count}</span>:null;}
