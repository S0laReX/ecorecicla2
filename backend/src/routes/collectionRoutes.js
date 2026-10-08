const {Router,json}=require('express');
const {rateLimit}=require('express-rate-limit');
const {authenticate}=require('../middlewares/authenticate');
const {requireApprovedCompany}=require('../middlewares/requireApprovedCompany');
const controller=require('../controllers/collectionController');
const reservationController=require('../controllers/reservationController');
const router=Router();
router.use(json({limit:'16kb'}));
router.use(rateLimit({windowMs:60000,limit:120,standardHeaders:'draft-8',legacyHeaders:false,
 handler:(_req,res)=>{res.status(429).json({success:false,message:'Demasiadas solicitudes. Espera un minuto.',errorCode:'RATE_LIMITED',statusCode:429});}}));
router.use(authenticate,requireApprovedCompany);
router.get('/agenda',reservationController.listAgenda);
router.get('/publications',controller.listAvailablePublications);
router.post('/publications/:publicationUUID/accept',reservationController.acceptPublication);
router.get('/publications/:publicationUUID',controller.retrieveAvailablePublication);
router.post('/reservations/:reservationUUID/cancel',reservationController.cancelReservation);
module.exports=router;
