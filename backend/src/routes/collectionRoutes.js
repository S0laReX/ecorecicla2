const {Router}=require('express');
const {rateLimit}=require('express-rate-limit');
const {authenticate}=require('../middlewares/authenticate');
const {requireApprovedCompany}=require('../middlewares/requireApprovedCompany');
const controller=require('../controllers/collectionController');
const router=Router();
router.use(rateLimit({windowMs:60000,limit:120,standardHeaders:'draft-8',legacyHeaders:false,
 handler:(_req,res)=>{res.status(429).json({success:false,message:'Demasiadas solicitudes. Espera un minuto.',errorCode:'RATE_LIMITED',statusCode:429});}}));
router.use(authenticate,requireApprovedCompany);
router.get('/publications',controller.listAvailablePublications);
router.get('/publications/:publicationUUID',controller.retrieveAvailablePublication);
module.exports=router;
