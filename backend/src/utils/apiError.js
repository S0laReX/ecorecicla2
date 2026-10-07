const CustomModelError = require('./customModelError');
/** FORMAT SAFE API ERROR @param {unknown} error @returns {{success:false,message:string,errorCode:string,statusCode:number}} */
exports.apiError = (error) => error instanceof CustomModelError
  ? {success:false,message:error.message,errorCode:error.errorCode,statusCode:error.statusCode}
  : {success:false,message:'No se pudo completar la operación.',errorCode:'INTERNAL_SERVER_ERROR',statusCode:500};
