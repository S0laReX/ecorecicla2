const test=require('node:test');const assert=require('node:assert/strict');
const {parseAvailabilityWindow,isWithinAvailabilityWindow}=require('../src/utils/availabilityWindow');
const {reservationExpiry}=require('../src/utils/availabilityWindow');
test('reservation deadline uses the reserved Bolivia calendar day and exact window end',()=>{
 assert.equal(reservationExpiry('Lunes de 16:00 a 18:00',new Date('2026-10-12T20:30:00Z')).toISOString(),'2026-10-12T22:00:00.000Z');
 assert.equal(reservationExpiry('Lunes de 20:00 a 23:59',new Date('2026-10-13T02:00:00Z')).toISOString(),'2026-10-13T03:59:00.000Z');
 assert.equal(reservationExpiry('Lunes de 16:00 a 18:00',new Date('2026-10-12T22:00:00Z')).toISOString(),'2026-10-12T22:00:00.000Z');
 assert.equal(reservationExpiry('Lunes de 16:00 a 18:00',new Date('2026-10-12T22:00:01Z')),null);
});
test('parses one day and accented Spanish weekday ranges',()=>{
 const single=parseAvailabilityWindow('Lunes de 16:00 a 18:00');assert.deepEqual([...single.weekdays],[1]);assert.equal(single.startMinute,960);assert.equal(single.endMinute,1080);
 const weekdays=parseAvailabilityWindow('Lunes a viernes de 09:00 a 17:00');assert.deepEqual([...weekdays.weekdays],[1,2,3,4,5]);
 const accent=parseAvailabilityWindow('Miércoles 09:00–12:00');assert.deepEqual([...accent.weekdays],[3]);
});
test('checks chosen date and time in the publisher weekly window using Bolivia time',()=>{
 const availability='Lunes a viernes de 09:00 a 17:00';
 assert.equal(isWithinAvailabilityWindow(availability,new Date('2026-10-12T14:00:00.000Z')),true);
 assert.equal(isWithinAvailabilityWindow(availability,new Date('2026-10-12T12:59:00.000Z')),false);
 assert.equal(isWithinAvailabilityWindow(availability,new Date('2026-10-12T21:01:00.000Z')),false);
 assert.equal(isWithinAvailabilityWindow(availability,new Date('2026-10-10T14:00:00.000Z')),false);
 assert.equal(isWithinAvailabilityWindow(availability,new Date('2026-10-12T21:00:30.000Z')),false);
});
test('rejects unstructured availability windows instead of accepting unverifiable schedules',()=>{
 assert.equal(parseAvailabilityWindow('Cuando puedas'),null);
 assert.equal(parseAvailabilityWindow('Lunes de 17:00 a 09:00'),null);
 assert.equal(isWithinAvailabilityWindow('Horario flexible',new Date('2026-10-12T14:00:00.000Z')),null);
});
