const {Router} = require('express');
const multer = require('multer');
const {rateLimit} = require('express-rate-limit');
const {authenticate} = require('../middlewares/authenticate');
const {createPublication} = require('../controllers/publicationController');
const router = Router();
const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1,fields:4,parts:5,fieldSize:2048,fieldNameSize:100}});
/** POST — CREATE PUBLICATION — /api/publications */
router.post('/',rateLimit({windowMs:60000,limit:20,standardHeaders:'draft-8',legacyHeaders:false,
  handler:(_req,res)=>{res.status(429).json({success:false,message:'Espera un minuto antes de volver a intentar.',errorCode:'RATE_LIMITED',statusCode:429});}}),authenticate,upload.single('photo'),createPublication);
module.exports = router;
