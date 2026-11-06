const {test}=require('node:test');
const assert=require('node:assert/strict');
const {rewardInputSchema,rewardUpdateSchema,redemptionInputSchema,rankingQuerySchema}=require('../src/schemas/rewardSchema');
const {monthBounds,currentMonth}=require('../src/utils/rankingMonth');
const {randomUUID}=require('node:crypto');

test('reward validation rejects privilege fields, malformed costs and inventory',()=>{
 const valid={name:'Botella reutilizable',description:'Recoger en recepción',pointsCost:30,stock:5,isActive:true};
 assert.equal(rewardInputSchema.parse({...valid,name:'  Botella reutilizable  '}).name,valid.name);
 for(const change of [{name:' '},{name:'x'.repeat(121)},{description:'x'.repeat(1001)},{description:'bad\u0000text'},{pointsCost:0},{pointsCost:1.5},{pointsCost:'30'},{pointsCost:1000001},{stock:-1},{stock:1.5},{stock:1000001},{isActive:'true'},{userId:'1'},{version:1}])assert.equal(rewardInputSchema.safeParse({...valid,...change}).success,false);
 assert.equal(rewardUpdateSchema.safeParse({...valid,version:1}).success,true);
 assert.equal(rewardUpdateSchema.safeParse(valid).success,false);
 const request={requestUUID:randomUUID(),expectedPointsCost:30};
 assert.equal(redemptionInputSchema.safeParse(request).success,true);
 for(const change of [{pointsCost:1},{userId:'2'},{expectedPointsCost:-1},{requestUUID:'bad'}])assert.equal(redemptionInputSchema.safeParse({...request,...change}).success,false);
});

test('monthly ranking validates calendar months and uses Bolivian boundaries',()=>{
 for(const month of ['2026-00','2026-13','26-01','2026-1',"2026-01' OR 1=1",'1999-12'])assert.equal(rankingQuerySchema.safeParse({month}).success,false);
 assert.equal(rankingQuerySchema.safeParse({month:'2026-11',userId:'2'}).success,false);
 assert.deepEqual(monthBounds('2026-12'),{start:new Date('2026-12-01T04:00:00Z'),end:new Date('2027-01-01T04:00:00Z')});
 assert.deepEqual(monthBounds('2028-02'),{start:new Date('2028-02-01T04:00:00Z'),end:new Date('2028-03-01T04:00:00Z')});
 assert.equal(currentMonth(new Date('2026-11-01T03:59:59.999Z')),'2026-10');
 assert.equal(currentMonth(new Date('2026-11-01T04:00:00.000Z')),'2026-11');
});
