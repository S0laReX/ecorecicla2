const express = require('express');
const helmet = require('helmet').default;
const multer = require('multer');
const {randomUUID} = require('node:crypto');
const publicationRoutes = require('./routes/publicationRoutes');
const CustomModelError = require('./utils/customModelError');
const {apiError} = require('./utils/apiError');
const {AuditService} = require('./services/auditService');
const {LogCategory} = require('./utils/logCategories');
const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use((req,res,next)=>{req.requestId=randomUUID();res.setHeader('X-Request-ID',req.requestId);res.setHeader('Cache-Control','no-store');next();});
app.use('/api/publications',publicationRoutes);
app.use('/api/auth',require('./routes/authRoutes'));
app.use((_req,res)=>{res.status(404).json({success:false,message:'Recurso no encontrado.',errorCode:'NOT_FOUND',statusCode:404});});
/** @type {import('express').ErrorRequestHandler} */
const errorHandler = async (error,req,res,_next) => {
  let normalized = error instanceof multer.MulterError
    ? new CustomModelError('Upload','Carga inválida: comprueba los campos y el archivo de hasta 5 MiB.', 'UPLOAD_INVALID',error.code==='LIMIT_FILE_SIZE'?413:422)
    : error;
  if(error?.type==='entity.parse.failed')normalized=new CustomModelError('Request','El JSON de la solicitud no es válido.','INVALID_JSON',400);
  if(error?.type==='entity.too.large')normalized=new CustomModelError('Request','La solicitud supera el tamaño permitido.','PAYLOAD_TOO_LARGE',413);
  const failure = apiError(normalized);
  await AuditService.logSystem(LogCategory.SECURITY,'ERROR','Request rejected','app.js','errorHandler',req.ip || null,{requestId:req.requestId,errorCode:failure.errorCode});
  return res.status(failure.statusCode).json(failure);
};
app.use(errorHandler);
module.exports = app;
