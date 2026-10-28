const {Router,json}=require('express');
const {authenticate}=require('../middlewares/authenticate');
const controller=require('../controllers/profileController');
const router=Router();router.use(json({limit:'16kb'}));router.use(authenticate);
router.get('/me',controller.read);router.patch('/me',controller.update);router.get('/me/history',controller.history);
module.exports=router;
