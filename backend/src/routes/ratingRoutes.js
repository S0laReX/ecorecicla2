const {Router,json}=require('express');
const {rateLimit}=require('express-rate-limit');
const {authenticate}=require('../middlewares/authenticate');
const controller=require('../controllers/ratingController');
const router=Router();
router.use(json({limit:'16kb'}),rateLimit({windowMs:60000,limit:60,standardHeaders:'draft-8',legacyHeaders:false,
 handler:(_req,res)=>res.status(429).json({success:false,message:'Demasiadas solicitudes. Espera un minuto.',errorCode:'RATE_LIMITED',statusCode:429})}),authenticate);
router.get('/pending',controller.listPending);
router.get('/me',controller.readMyProfileRating);
router.post('/reservations/:reservationUUID',controller.rateCollection);
module.exports=router;
