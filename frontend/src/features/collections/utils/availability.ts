const indexes:Record<string,number>={domingo:0,lunes:1,martes:2,miercoles:3,jueves:4,viernes:5,sabado:6};
export function parseAvailability(text:string){
 const normalized=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const days=[...normalized.matchAll(/\b(domingo|lunes|martes|miercoles|jueves|viernes|sabado)\b/g)];
 const times=[...normalized.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)];
 if(!days.length||times.length!==2)return null;
 const start=Number(times[0][1])*60+Number(times[0][2]),end=Number(times[1][1])*60+Number(times[1][2]);
 if(start>=end)return null;
 const weekdays=new Set<number>();
 if(days.length===2&&/^\s*(?:a|al|hasta|[-–])\s*$/.test(normalized.slice(days[0].index!+days[0][0].length,days[1].index))){
  for(let i=0;i<7;i++){const day=(indexes[days[0][1]]+i)%7;weekdays.add(day);if(day===indexes[days[1][1]])break;}
 }else for(const day of days)weekdays.add(indexes[day[1]]);
 return {weekdays,start,end};
}
export function availableTimes(text:string,date:string,now=Date.now()){
 const window=parseAvailability(text);
 if(!window||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!window.weekdays.has(new Date(`${date}T12:00:00-04:00`).getUTCDay()))return [];
 return Array.from({length:window.end-window.start+1},(_,i)=>window.start+i).map(minute=>`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`).filter(time=>new Date(`${date}T${time}:00-04:00`).getTime()>now);
}
