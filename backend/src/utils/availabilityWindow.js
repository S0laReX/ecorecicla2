/** @type {Record<string,number>} */
const WEEKDAY_INDEX={domingo:0,lunes:1,martes:2,miercoles:3,jueves:4,viernes:5,sabado:6};
const WEEKDAY_PATTERN=/\b(domingo|lunes|martes|miercoles|jueves|viernes|sabado)\b/g;
/** PARSE A SIMPLE SPANISH WEEKLY AVAILABILITY WINDOW
 * Accepted shape: one or more Spanish weekdays and one start/end time in HH:mm.
 * @param {string} availabilityText @returns {{weekdays:Set<number>,startMinute:number,endMinute:number}|null}
 */
function parseAvailabilityWindow(availabilityText){
 const normalized=availabilityText.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const weekdays=[...normalized.matchAll(WEEKDAY_PATTERN)];
 const times=[...normalized.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)];
 if(weekdays.length===0||times.length!==2)return null;
 const startMinute=Number(times[0][1])*60+Number(times[0][2]);const endMinute=Number(times[1][1])*60+Number(times[1][2]);
 if(startMinute>=endMinute)return null;
 const weekdaysAllowed=new Set();
 if(weekdays.length===2&&/^\s*(?:a|al|hasta|[-–])\s*$/.test(normalized.slice(weekdays[0].index+weekdays[0][0].length,weekdays[1].index))){
  const start=WEEKDAY_INDEX[weekdays[0][1]],end=WEEKDAY_INDEX[weekdays[1][1]];let day=start;
  for(let count=0;count<7;count++){weekdaysAllowed.add(day);if(day===end)break;day=(day+1)%7;}
 }else for(const weekday of weekdays)weekdaysAllowed.add(WEEKDAY_INDEX[weekday[1]]);
 return {weekdays:weekdaysAllowed,startMinute,endMinute};
}
/** CHECK A SCHEDULE AGAINST THE PUBLISHER'S WEEKLY WINDOW IN BOLIVIA TIME
 * @param {string} availabilityText @param {Date} scheduledAt @returns {boolean|null}
 */
function isWithinAvailabilityWindow(availabilityText,scheduledAt){
 const window=parseAvailabilityWindow(availabilityText);if(!window||!Number.isFinite(scheduledAt.getTime()))return null;
 const parts=new Intl.DateTimeFormat('es-BO',{timeZone:'America/La_Paz',weekday:'long',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(scheduledAt);
 const values=Object.fromEntries(parts.map(part=>[part.type,part.value]));
 const weekday=values.weekday.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const minuteOfDay=Number(values.hour)*60+Number(values.minute)+Number(values.second)/60;
 return window.weekdays.has(WEEKDAY_INDEX[weekday])&&minuteOfDay>=window.startMinute&&minuteOfDay<=window.endMinute;
}
/** FREEZE THE END OF THE RESERVED DAY'S WINDOW IN UTC (BOLIVIA UTC-04).
 * @param {string} text @param {Date} scheduledAt @returns {Date|null}
 */
function reservationExpiry(text,scheduledAt){
 const window=parseAvailabilityWindow(text);
 if(!window||!isWithinAvailabilityWindow(text,scheduledAt))return null;
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'America/La_Paz',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(scheduledAt).map(p=>[p.type,p.value]));
 return new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),4,window.endMinute));
}
module.exports={parseAvailabilityWindow,isWithinAvailabilityWindow,reservationExpiry};
