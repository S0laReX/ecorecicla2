const {Router,json}=require('express');
const multer=require('multer');
const {rateLimit}=require('express-rate-limit');
const {registerUser}=require('../controllers/authController');
const controller=require('../controllers/authController');
const {authenticate}=require('../middlewares/authenticate');
const router=Router();
const limiter=rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-8',legacyHeaders:false,handler:(_req,res)=>{res.status(429).json({success:false,message:'Demasiados intentos. Vuelve a intentarlo más tarde.',errorCode:'RATE_LIMITED',statusCode:429});}});
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5242880,files:1,fields:7,parts:8,fieldSize:2048}});
/** POST — REGISTER ACCOUNT — /api/auth/register */
router.post('/register',limiter,upload.single('document'),registerUser);
router.use(json({limit:'16kb'}));
/** POST — AUTHENTICATE USER — /api/auth/login */
router.post('/login',limiter,controller.authenticateUser);
/** POST — REFRESH SESSION — /api/auth/refresh */
router.post('/refresh',limiter,controller.refreshUserSession);
/** GET — RETRIEVE CURRENT USER — /api/auth/me */
router.get('/me',authenticate,controller.retrieveCurrentUser);
/** GET — RETRIEVE ROLE DASHBOARD — /api/auth/dashboard/:role */
router.get('/dashboard/:role',authenticate,controller.retrieveRoleDashboard);
/** POST — LOGOUT USER — /api/auth/logout */
router.post('/logout',authenticate,controller.logoutUser);
/** POST — REQUEST PASSWORD RECOVERY — /api/auth/forgot-password */
router.post('/forgot-password',limiter,controller.requestPasswordRecovery);
/** POST — RESET PASSWORD — /api/auth/reset-password */
router.post('/reset-password',limiter,controller.resetUserPassword);
module.exports=router;
