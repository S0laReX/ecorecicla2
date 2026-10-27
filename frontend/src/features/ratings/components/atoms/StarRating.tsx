import {Button} from '../../../../shared/components/atoms/Button';
export function StarRating({value,onChange,label='Calificación',readOnly=false}:{value:number|null;onChange?:(score:number)=>void;label?:string;readOnly?:boolean}){
 const stars=Array.from({length:5},(_,index)=>index+1);
 if(readOnly){const shown=value===null?'Sin calificaciones':`${value.toFixed(2)} de 5 estrellas`;return <span className="rating-stars-display" role="img" aria-label={shown}>{stars.map(star=><span key={star} aria-hidden="true" className={value!==null&&star<=Math.round(value)?'is-filled':''}>★</span>)}<span className="rating-stars-value">{value===null?'—':value.toFixed(2)}</span></span>;}
 return <div className="star-rating" role="group" aria-label={label}>{stars.map(star=><Button key={star} className={`star-rating-button${value!==null&&star<=value?' is-selected':''}`} aria-label={`${star} ${star===1?'estrella':'estrellas'}`} aria-pressed={value===star} onClick={()=>onChange?.(star)}>★</Button>)}</div>;
}
