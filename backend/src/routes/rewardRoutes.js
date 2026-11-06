const {Router,json}=require('express');
const {authenticate}=require('../middlewares/authenticate');
const controller=require('../controllers/rewardController');
const router=Router();router.use(json({limit:'16kb'}));router.use(authenticate);
router.get('/',controller.catalog);
router.get('/redemptions',controller.history);
router.post('/:rewardUUID/redeem',controller.redeem);
module.exports=router;
