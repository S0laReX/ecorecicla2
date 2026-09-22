const {randomUUID}=require('node:crypto');
const {PDFDocument}=require('pdf-lib');
const {pool}=require('../config/database');
const {registerSchema}=require('../schemas/authSchema');
const {hashPassword}=require('./passwordService');
const {normalizePhoto}=require('./publicationService');
const User=require('../models/User');
const CompanyProfile=require('../models/CompanyProfile');
const CustomModelError=require('../utils/customModelError');
/** PROJECT PUBLIC ACCOUNT @param {import('../models/User').UserContext} user */
function publicUser(user){return {userUUID:user.userUUID,displayName:user.userDisplayName,email:user.userEmail,roleCode:user.userRoleCode,accountStatus:user.userAccountStatus,verificationStatus:user.userVerificationStatus};}
/** VALIDATE PRIVATE VERIFICATION DOCUMENT @param {Express.Multer.File|undefined} file @returns {Promise<{documentContent:Buffer,documentMime:'application/pdf'|'image/jpeg'}>} */
async function validateDocument(file){
 if(!file||file.size<4||file.size>5242880)throw new CustomModelError('CompanyProfile','Adjunta un documento PDF o imagen de hasta 5 MiB.','DOCUMENT_INVALID');
 if(file.buffer.subarray(0,5).toString()==='%PDF-'){
  try{const pdf=await PDFDocument.load(file.buffer);if(pdf.isEncrypted||pdf.getPageCount()<1||pdf.getPageCount()>30)throw new Error('Invalid PDF');}
  catch{throw new CustomModelError('CompanyProfile','El PDF debe ser válido, sin contraseña y de hasta 30 páginas.','DOCUMENT_INVALID');}
  return {documentContent:file.buffer,documentMime:'application/pdf'};
 }
 try{return {documentContent:await normalizePhoto(file),documentMime:'image/jpeg'};}
 catch{throw new CustomModelError('CompanyProfile','Usa un PDF válido o una imagen JPEG, PNG o WebP.','DOCUMENT_INVALID');}
}
/** REGISTER USER OR COMPANY @param {unknown} body @param {Express.Multer.File|undefined} file */
async function registerAccount(body,file){
 const parsed=registerSchema.safeParse(body);if(!parsed.success)throw new CustomModelError('User','Revisa los campos. La contraseña requiere 12 caracteres, letras y números.');
 const data=parsed.data;
 if(data.roleCode==='USER'&&file)throw new CustomModelError('User','El documento solo corresponde al registro de empresas.');
 const document=data.roleCode==='COMPANY'?await validateDocument(file):null;
 const passwordHash=await hashPassword(data.password);const connection=await pool.getConnection();
 try{
  await connection.beginTransaction();
  const user=await User.create({userUUID:randomUUID(),displayName:data.displayName,email:data.email,passwordHash,roleCode:data.roleCode,verificationDocumentKey:document?randomUUID():null},connection);
  if(data.roleCode==='COMPANY'&&document)await CompanyProfile.create({userId:user.userId,taxIdentifier:data.taxIdentifier,contactName:data.contactName,coverageArea:data.coverageArea,...document},connection);
  await connection.commit();return publicUser(user);
 }catch(error){await connection.rollback();if(error&&typeof error==='object'&&'code'in error&&error.code==='ER_DUP_ENTRY')throw new CustomModelError('User','El correo o RUC/NIT ya está registrado.','ACCOUNT_EXISTS',409);throw error;}
 finally{connection.release();}
}
module.exports={registerAccount,publicUser,validateDocument};
