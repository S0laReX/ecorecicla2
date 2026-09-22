const {Router}=require('express');
const multer=require('multer');
const {rateLimit}=require('express-rate-limit');
const {registerUser}=require('../controllers/authController');
const router=Router();
const limiter=rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-8',legacyHeaders:false,handler:(_req,res)=>{res.status(429).json({success:false,message:'Demasiados intentos. Vuelve a intentarlo más tarde.',errorCode:'RATE_LIMITED',statusCode:429});}});
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5242880,files:1,fields:7,parts:8,fieldSize:2048}});
/** POST — REGISTER ACCOUNT — /api/auth/register */
router.post('/register',limiter,upload.single('document'),registerUser);
module.exports=router;
