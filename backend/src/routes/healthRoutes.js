const {Router}=require('express');
const {pool}=require('../config/database');
const router=Router();
router.get('/health',(_req,res)=>{res.status(res.app.locals.shuttingDown?503:200).json({success:!res.app.locals.shuttingDown});});
router.get('/ready',async(_req,res)=>{
 if(res.app.locals.shuttingDown){res.status(503).json({success:false});return;}
 /** @type {ReturnType<typeof setTimeout>|undefined} */
 let timer;
 try{
  await Promise.race([
   pool.query({sql:'SELECT 1',timeout:3000}),
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Readiness timeout')),4000);timer.unref();})
  ]);
  res.status(200).json({success:true});
 }catch{res.status(503).json({success:false});}
 finally{clearTimeout(timer);}
});
module.exports=router;
