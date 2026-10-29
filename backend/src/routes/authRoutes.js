const {Router,json}=require('express');
const multer=require('multer');
const {rateLimit}=require('express-rate-limit');
const {registerUser}=require('../controllers/authController');
const controller=require('../controllers/authController');
const {authenticate}=require('../middlewares/authenticate');
const router=Router();
const recoveryLimiter=rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-8',legacyHeaders:false,handler:(_req,res)=>{res.status(429).json({success:false,message:'Demasiados intentos. Vuelve a intentarlo más tarde.',errorCode:'RATE_LIMITED',statusCode:429});}});
// Independent per-IP budgets. Query strings never create a new budget.
/** @param {number} limit @param {string} identifier */
function minuteLimit(limit,identifier){return rateLimit({windowMs:60000,limit,identifier,standardHeaders:'draft-8',legacyHeaders:false,handler:(_req,res)=>{res.status(429).json({success:false,message:'Demasiados intentos. Espera un minuto y vuelve a intentarlo.',errorCode:'RATE_LIMITED',statusCode:429});}});}
const authenticationLimiter=minuteLimit(20,'authentication');
const registrationLimiter=minuteLimit(100,'registration');
// Run before body parsing, uploads and controller work, including malformed requests.
router.use(['/login','/refresh'],authenticationLimiter);
router.use('/register',registrationLimiter);
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5242880,files:1,fields:7,parts:8,fieldSize:2048}});
/** POST — REGISTER ACCOUNT — /api/auth/register */
router.post('/register',upload.single('document'),registerUser);
router.use(json({limit:'16kb'}));
/** POST — AUTHENTICATE USER — /api/auth/login */
router.post('/login',controller.authenticateUser);
/** POST — REFRESH SESSION — /api/auth/refresh */
router.post('/refresh',controller.refreshUserSession);
/** GET — RETRIEVE CURRENT USER — /api/auth/me */
router.get('/me',authenticate,controller.retrieveCurrentUser);
/** GET — RETRIEVE ROLE DASHBOARD — /api/auth/dashboard/:role */
router.get('/dashboard/:role',authenticate,controller.retrieveRoleDashboard);
/** POST — LOGOUT USER — /api/auth/logout */
router.post('/logout',authenticate,controller.logoutUser);
/** POST — REQUEST PASSWORD RECOVERY — /api/auth/forgot-password */
router.post('/forgot-password',recoveryLimiter,controller.requestPasswordRecovery);
/** POST — RESET PASSWORD — /api/auth/reset-password */
router.post('/reset-password',recoveryLimiter,controller.resetUserPassword);
module.exports=router;
