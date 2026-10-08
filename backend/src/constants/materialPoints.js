// Provisional values approved for US9: points per completed collection, not per kg.
// Future administrative configuration must affect new awards only.
module.exports=Object.freeze(Object.fromEntries(
 ['plastico','papel','vidrio','metal','organico'].map(material=>[material,Object.freeze({publisher:10,collector:10})])
));
