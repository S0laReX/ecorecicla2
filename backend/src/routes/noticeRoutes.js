const {Router}=require('express');
const {authenticate}=require('../middlewares/authenticate');
const controller=require('../controllers/noticeController');
const router=Router();router.use(authenticate);
router.get('/',controller.list);router.get('/unread-count',controller.count);router.patch('/:uuid/read',controller.markRead);
module.exports=router;
