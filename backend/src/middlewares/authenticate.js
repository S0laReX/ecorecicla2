const jwt = require('jsonwebtoken');
const {z} = require('zod');
const CustomModelError = require('../utils/customModelError');
const claimsSchema = z.object({sub:z.string().uuid(),tokenVersion:z.number().int().nonnegative(),iat:z.number().int(),exp:z.number().int()})
  .refine(c=>c.exp>c.iat && c.exp-c.iat<=1800 && c.iat<=Math.floor(Date.now()/1000)+5);
/** VERIFY ACCESS TOKEN
 * @param {import('express').Request} req @param {import('express').Response} res
 * @param {import('express').NextFunction} next @returns {void}
 */
exports.authenticate = (req,res,next) => {
  try {
    const header = req.get('authorization');
    if (!header || !/^Bearer [^\s]+$/.test(header)) throw new Error('Missing bearer');
    const key = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g,'\n');
    if (!key || !process.env.JWT_ISSUER || !process.env.JWT_AUDIENCE) throw new Error('Auth not configured');
    const decoded = jwt.verify(header.slice(7),key,{algorithms:['RS256'],issuer:process.env.JWT_ISSUER,audience:process.env.JWT_AUDIENCE,maxAge:'30m'});
    const claims = claimsSchema.parse(decoded);
    req.auth = {userUUID:claims.sub,tokenVersion:claims.tokenVersion};
    next();
  } catch { next(new CustomModelError('User','La sesión es inválida o expiró.','SESSION_INVALID',401)); }
};
