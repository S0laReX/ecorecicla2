const sharp = require('sharp');
const {pool} = require('../config/database');
const User = require('../models/User');
const Publication = require('../models/Publication');
const CustomModelError = require('../utils/customModelError');
const {AuditService} = require('./auditService');
const {LogCategory} = require('../utils/logCategories');
const {lockSessionUser}=require('./sessionPolicy');
/** AUTHORIZE PUBLICATION CREATION
 * Pending companies may publish their own material (backlog US4).
 * @param {import('../models/User').UserContext|null} user @param {number} tokenVersion
 * @returns {asserts user is import('../models/User').UserContext}
 */
function authorizePublisher(user,tokenVersion) {
  if (!user || user.userTokenVersion !== tokenVersion) throw new CustomModelError('User','La sesión ya no es válida.','SESSION_INVALID',401);
  if (user.userAccountStatus !== 'ACTIVE') throw new CustomModelError('User','Tu cuenta está suspendida.','ACCOUNT_SUSPENDED',403);
  if (!['USER','COMPANY'].includes(user.userRoleCode)) throw new CustomModelError('User','Tu rol no permite publicar materiales.','ROLE_FORBIDDEN',403);
  if (user.userRoleCode === 'COMPANY' && !['PENDING','APPROVED'].includes(user.userVerificationStatus))
    throw new CustomModelError('User','La verificación de tu empresa fue rechazada.','COMPANY_REJECTED',403);
}
/** NORMALIZE UNTRUSTED PHOTO
 * @param {Express.Multer.File|undefined} file @returns {Promise<Buffer>}
 */
async function normalizePhoto(file) {
  if (!file || file.size === 0 || file.size > 5*1024*1024)
    throw new CustomModelError('Publication','Adjunta una foto de hasta 5 MiB.','PHOTO_INVALID');
  try {
    const image = sharp(file.buffer,{limitInputPixels:16000000,failOn:'warning'});
    const metadata = await image.metadata();
    if (!['jpeg','png','webp'].includes(metadata.format || '') || (metadata.pages || 1) !== 1) throw new Error('Unsupported image');
    // Decode, orient and re-encode: remove EXIF/GPS, ignore filename and supplied MIME type.
    const photo = await image.rotate().resize(1280,1280,{fit:'inside',withoutEnlargement:true}).jpeg({quality:80}).toBuffer();
    if (photo.length > 1048576) throw new Error('Normalized photo too large');
    return photo;
  } catch {
    throw new CustomModelError('Publication','La foto debe ser JPEG, PNG o WebP estático, de hasta 16 megapíxeles.','PHOTO_INVALID');
  }
}
/** CREATE PUBLICATION IN AN AUTHORIZED TRANSACTION
 * @param {import('./sessionPolicy').AuthContext} auth
 * @param {import('../models/Publication').PublicationFields} fields
 * @param {Express.Multer.File|undefined} file
 * @returns {Promise<import('../models/Publication').PublicationRecord>}
 */
async function createPublicationForUser(auth,fields,file) {
  const photoJpeg = await normalizePhoto(file);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const user = await lockSessionUser(auth,connection);
    authorizePublisher(user,auth.tokenVersion);
    const publication = await Publication.create({...fields,ownerId:user.userId,photoJpeg},connection);
    await connection.commit();
    return publication;
  } catch (error) {
    try { await connection.rollback(); } catch {
      await AuditService.logSystem(LogCategory.STABILITY,'ERROR','Transaction rollback failed','publicationService.js','createPublicationForUser',null);
    }
    throw error;
  } finally { connection.release(); }
}
module.exports = {createPublicationForUser,normalizePhoto,authorizePublisher};
