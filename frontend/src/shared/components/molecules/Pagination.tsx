import {Button} from '../atoms/Button';
export function Pagination({page,total,limit,onPage,disabled=false}:{page:number;total:number;limit:number;onPage:(page:number)=>void;disabled?:boolean}){
 const pages=Math.max(1,Math.ceil(total/limit));
 if(pages===1&&page===1)return null;
 return <nav className="pagination" aria-label="Paginación"><Button className="button-secondary" disabled={disabled||page<=1} onClick={()=>onPage(page-1)}>Anterior</Button><span>Página {page} de {pages}</span><Button className="button-secondary" disabled={disabled||page>=pages} onClick={()=>onPage(page+1)}>Siguiente</Button></nav>;
}
