// Defaults for unconfigured materials: points per completed collection, not per kg.
// US12 overrides affect future confirmations only; historical awards are immutable.
module.exports=Object.freeze(Object.fromEntries(
 ['plastico','papel','vidrio','metal','organico'].map(material=>[material,Object.freeze({publisher:10,collector:10})])
));
