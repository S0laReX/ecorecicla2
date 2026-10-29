const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const compiled=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/features/collections/utils/availability.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const loaded={exports:{}};new Function('module','exports',compiled)(loaded,loaded.exports);
const {availableTimes}=loaded.exports;
const {isWithinAvailabilityWindow}=require('../../backend/src/utils/availabilityWindow');
test('one, two separate and multiple selected days offer only times accepted by the API',()=>{
 for(const days of ['Lunes','Lunes, Miércoles','Lunes, Martes, Miércoles','Lunes a viernes','Sábado a lunes']){
  const text=days+' de 03:30 a 04:00';
  for(let day=12;day<=18;day++){
   const date=`2026-10-${day}`,times=availableTimes(text,date,0);
   for(const time of ['03:29','03:30','03:54','04:00','04:01','15:54'])assert.equal(times.includes(time),isWithinAvailabilityWindow(text,new Date(`${date}T${time}:00-04:00`)),`${text}: ${date} ${time}`);
  }
 }
});
test('past slots, malformed availability and wrong weekdays cannot be offered',()=>{
 const text='Lunes, Miércoles de 03:30 a 04:00';
 assert.deepEqual(availableTimes(text,'2026-10-13',0),[]);
 assert.deepEqual(availableTimes('Cuando puedas','2026-10-12',0),[]);
 assert.deepEqual(availableTimes(text,'2026-10-12',Date.parse('2026-10-12T08:00:00Z')),[]);
 assert.equal(availableTimes(text,'2026-10-12',Date.parse('2026-10-12T07:53:00Z'))[0],'03:54');
});
