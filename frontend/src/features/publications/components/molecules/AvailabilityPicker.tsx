'use client';
import {useEffect,useRef,useState} from 'react';
const weekdays=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function parse(text:string){
 const matches=[...normalize(text).matchAll(/\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/g)];
 let days=matches.map(match=>weekdays.findIndex(day=>normalize(day)===match[0]));
 if(matches.length===2&&/^\s*(a|al|hasta|[-–])\s*$/.test(normalize(text).slice(matches[0].index!+matches[0][0].length,matches[1].index))){const first=days[0],last=days[1];days=[];for(let i=0;i<7;i++){const day=(first+i)%7;days.push(day);if(day===last)break;}}
 const times=text.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g)?.map(time=>time.padStart(5,'0'));
 return {days:[...new Set(days)],start:times?.[0]||'',end:times?.[1]||''};
}
const times=[...Array.from({length:96},(_,index)=>`${String(Math.floor(index/4)).padStart(2,'0')}:${String(index%4*15).padStart(2,'0')}`),'23:59'];
export function AvailabilityPicker({initial='',error}:{initial?:string;error?:string}){
 const [days,setDays]=useState(()=>parse(initial).days);const [start,setStart]=useState(()=>parse(initial).start);const [end,setEnd]=useState(()=>parse(initial).end);
 const root=useRef<HTMLFieldSetElement>(null);const endSelect=useRef<HTMLSelectElement>(null);
 useEffect(()=>{endSelect.current?.setCustomValidity(start&&end&&start>=end?'La hora de fin debe ser posterior a la hora de inicio.':'');},[start,end]);
 useEffect(()=>{const form=root.current?.form;const reset=()=>{const value=parse(initial);setDays(value.days);setStart(value.start);setEnd(value.end);};form?.addEventListener('reset',reset);return()=>form?.removeEventListener('reset',reset);},[initial]);
 const options=[...new Set([...times,...[start,end].filter(Boolean)])].sort();
 const selectedDays=weekdays.filter((_,index)=>days.includes(index));
 const preview=selectedDays.join(selectedDays.length===2?' a ':', ')+` de ${start} a ${end}`;
 // Preserve explicit days in the API: 'a' is parsed there as an inclusive range.
 const value=days.length&&start&&end&&start<end?`${weekdays.filter((_,index)=>days.includes(index)).join(', ')} de ${start} a ${end}`:'';
 return <fieldset ref={root} className="availability-picker" aria-label="Seleccionar disponibilidad"><div className="availability-days">{weekdays.map((day,index)=><label key={day}><input type="checkbox" checked={days.includes(index)} required={index===0&&days.length===0} onChange={event=>setDays(previous=>event.target.checked?[...previous,index]:previous.filter(item=>item!==index))}/>{day}</label>)}</div><div className="availability-hours"><label htmlFor="availability-start">Desde<select id="availability-start" required value={start} onChange={event=>setStart(event.target.value)}><option value="">Selecciona una hora</option>{options.map(time=><option key={time}>{time}</option>)}</select></label><label htmlFor="availability-end">Hasta<select id="availability-end" ref={endSelect} required value={end} onChange={event=>setEnd(event.target.value)}><option value="">Selecciona una hora</option>{options.map(time=><option key={time} disabled={!!start&&time<=start}>{time}</option>)}</select></label></div><input type="hidden" name="availabilityText" value={value}/>{value&&<p className="availability-preview">{preview}</p>}{error&&<p role="alert" className="error">{error}</p>}</fieldset>;
}
