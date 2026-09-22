const {publicationFieldsSchema,uuidSchema} = require('../schemas/publicationSchema');
const {createPublicationForUser} = require('../services/publicationService');
const CustomModelError = require('../utils/customModelError');
const {apiError} = require('../utils/apiError');
const {AuditService} = require('../services/auditService');
const {LogCategory} = require('../utils/logCategories');
const source = 'publicationController.js';
/**
 * CREATE PUBLICATION
 * POST /api/publications — authenticated multipart/form-data.
 * Identity comes only from verified middleware. Service checks current role/status under lock.
 * @param {import('express').Request<Record<string,string>,unknown,unknown>} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.createPublication = async (req,res) => {
  const functionName = 'createPublication';
  try {
    const auth = req.auth;
    if (!auth || !uuidSchema.safeParse(auth.userUUID).success || !Number.isSafeInteger(auth.tokenVersion) || auth.tokenVersion<0)
      throw new CustomModelError('User','Inicia sesión para continuar.','AUTH_REQUIRED',401);
    const parsed = publicationFieldsSchema.safeParse(req.body);
    if (!parsed.success) throw new CustomModelError('Publication','Revisa tipo, cantidad, ubicación y horario.','VALIDATION_ERROR',422);
    const publication = await createPublicationForUser(auth,parsed.data,req.file);
    res.status(201).json({success:true,message:'Publicación creada correctamente.',data:publication});
  } catch (error) {
    const failure = apiError(error);
    await AuditService.logSystem(LogCategory.OPERATIONAL,'ERROR','Could not create publication',source,functionName,req.ip || null,
      {requestId:req.requestId,errorCode:failure.errorCode,statusCode:failure.statusCode});
    res.status(failure.statusCode).json(failure);
  }
};
