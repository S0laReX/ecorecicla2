const {Router}=require('express');
const {authenticate}=require('../middlewares/authenticate');
const controller=require('../controllers/rewardController');
const router=Router();router.use(authenticate);router.get('/companies',controller.ranking);
module.exports=router;
