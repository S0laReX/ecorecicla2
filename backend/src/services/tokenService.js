const fs=require('node:fs');const path=require('node:path');const jwt=require('jsonwebtoken');const {createHash,randomBytes}=require('node:crypto');
/** HASH OPAQUE TOKEN @param {string} token @returns {string} */
function hashToken(token){return createHash('sha256').update(token).digest('hex');}
/** ISSUE ACCESS TOKEN @param {import('../models/User').UserContext} user @param {string} sessionUUID @returns {string} */
function accessToken(user,sessionUUID){
 const key=fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH||path.resolve(__dirname,'../../.keys/jwt-private.pem'));
 return jwt.sign({tokenVersion:user.userTokenVersion,sid:sessionUUID},key,{algorithm:'RS256',subject:user.userUUID,issuer:process.env.JWT_ISSUER,audience:process.env.JWT_AUDIENCE,expiresIn:'30m'});
}
/** GENERATE REFRESH TOKEN @param {string} sessionUUID @returns {string} */
function refreshToken(sessionUUID){return `${sessionUUID}.${randomBytes(32).toString('hex')}`;}
module.exports={hashToken,accessToken,refreshToken};
