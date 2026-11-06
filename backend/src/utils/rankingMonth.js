/** @param {Date} [now] */
exports.currentMonth=(now=new Date())=>{
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/La_Paz',year:'numeric',month:'2-digit'}).formatToParts(now);
 return `${parts.find(p=>p.type==='year')?.value}-${parts.find(p=>p.type==='month')?.value}`;
};
/** Bolivia's calendar months use UTC-04:00. SQL timestamps are UTC.
 * @param {string} month */
exports.monthBounds=month=>{
 const [year,value]=month.split('-').map(Number);
 return {start:new Date(Date.UTC(year,value-1,1,4)),end:new Date(Date.UTC(year,value,1,4))};
};
