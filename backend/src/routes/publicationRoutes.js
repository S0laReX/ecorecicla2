const {Router} = require('express');
const multer = require('multer');
const {rateLimit} = require('express-rate-limit');
const {authenticate} = require('../middlewares/authenticate');
const {createPublication} = require('../controllers/publicationController');
const controller=require('../controllers/publicationController');
const router = Router();
router.use(rateLimit({windowMs:60000,limit:120,standardHeaders:'draft-8',legacyHeaders:false,handler:(_req,res)=>{res.status(429).json({success:false,message:'Demasiadas solicitudes. Espera un minuto.',errorCode:'RATE_LIMITED',statusCode:429});}}));
const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1,fields:4,parts:5,fieldSize:2048,fieldNameSize:100}});
/** POST — CREATE PUBLICATION — /api/publications */
router.post('/',rateLimit({windowMs:60000,limit:20,standardHeaders:'draft-8',legacyHeaders:false,
  handler:(_req,res)=>{res.status(429).json({success:false,message:'Espera un minuto antes de volver a intentar.',errorCode:'RATE_LIMITED',statusCode:429});}}),authenticate,upload.single('photo'),createPublication);
/** GET — LIST OWN PUBLICATIONS — /api/publications/me */
router.get('/me',authenticate,controller.listOwnPublications);
/** GET — RETRIEVE OWN PUBLICATION — /api/publications/:publicationUUID */
router.get('/:publicationUUID',authenticate,controller.retrievePublication);
/** PATCH — UPDATE OWN PUBLICATION — /api/publications/:publicationUUID */
router.patch('/:publicationUUID',authenticate,upload.single('photo'),controller.updatePublication);
/** DELETE — DELETE OWN PUBLICATION — /api/publications/:publicationUUID */
router.delete('/:publicationUUID',authenticate,controller.deletePublication);
module.exports = router;
