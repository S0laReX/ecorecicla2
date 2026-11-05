const Ranking=require('../models/CompanyRanking');
const {retryTransaction:transaction}=require('./transactionService');
const {lockSessionUser}=require('./sessionPolicy');
const {rankingQuerySchema}=require('../schemas/rewardSchema');
const {currentMonth,monthBounds}=require('../utils/rankingMonth');
const CustomModelError=require('../utils/customModelError');
/** @param {import('./sessionPolicy').AuthContext} auth @param {unknown} input */
exports.read=(auth,input)=>transaction(async connection=>{
 const user=await lockSessionUser(auth,connection);
 if(user.userRoleCode!=='ADMIN'&&(user.userRoleCode!=='COMPANY'||user.userVerificationStatus!=='APPROVED'))throw new CustomModelError('User','El ranking está disponible para empresas aprobadas y administradores.','ROLE_FORBIDDEN',403);
 const parsed=rankingQuerySchema.safeParse(input);if(!parsed.success)throw new CustomModelError('CompanyRanking','Selecciona un mes válido y revisa la paginación.','VALIDATION_ERROR',422);
 const month=parsed.data.month||currentMonth();
 return {...await Ranking.read(monthBounds(month),parsed.data,user.userRoleCode==='COMPANY'?user.userUUID:null,connection),month,timeZone:'America/La_Paz'};
});
