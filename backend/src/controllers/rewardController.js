const service=require('../services/rewardService');
const ranking=require('../services/rankingService');
const CustomModelError=require('../utils/customModelError');
/** @param {import('express').Request} req */
function auth(req){if(!req.auth)throw new CustomModelError('User','Inicia sesión.','AUTH_REQUIRED',401);return req.auth;}
/** @param {import('express').Request} req */
function uuid(req){const value=req.params.rewardUUID||req.params.redemptionUUID;return typeof value==='string'?value:'';}
/** Express forwards rejected promises to the shared audited error handler. */
/** @type {import('express').RequestHandler} */
exports.catalog=async(req,res)=>res.json({success:true,message:'Premios recuperados.',data:await service.list(auth(req),req.query)});
/** @type {import('express').RequestHandler} */
exports.adminCatalog=async(req,res)=>res.json({success:true,message:'Catálogo recuperado.',data:await service.list(auth(req),req.query,true)});
/** @type {import('express').RequestHandler} */
exports.create=async(req,res)=>res.status(201).json({success:true,message:'Premio creado.',data:await service.create(auth(req),req.body)});
/** @type {import('express').RequestHandler} */
exports.update=async(req,res)=>res.json({success:true,message:'Premio actualizado.',data:await service.update(auth(req),uuid(req),req.body)});
/** @type {import('express').RequestHandler} */
exports.redeem=async(req,res)=>res.json({success:true,message:'Premio canjeado. Presenta tu código al administrador para recibirlo.',data:await service.redeem(auth(req),uuid(req),req.body)});
/** @type {import('express').RequestHandler} */
exports.history=async(req,res)=>res.json({success:true,message:'Mis canjes recuperados.',data:await service.history(auth(req),req.query)});
/** @type {import('express').RequestHandler} */
exports.adminHistory=async(req,res)=>res.json({success:true,message:'Canjes recuperados.',data:await service.history(auth(req),req.query,true)});
/** @type {import('express').RequestHandler} */
exports.deliver=async(req,res)=>res.json({success:true,message:'Entrega registrada.',data:await service.deliver(auth(req),uuid(req),req.body)});
/** @type {import('express').RequestHandler} */
exports.ranking=async(req,res)=>res.json({success:true,message:'Ranking mensual recuperado.',data:await ranking.read(auth(req),req.query)});
