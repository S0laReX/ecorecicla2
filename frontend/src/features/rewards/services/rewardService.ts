import {authenticatedRequest} from '../../auth/services/sessionService';
import {catalogSchema,redemptionsSchema,rewardSchema,redeemResultSchema,redemptionSchema,type RewardInput,type RedemptionStatus} from '../schemas/rewardSchema';
const json=(method:string,body:unknown)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
export async function fetchRewards(page:number,admin=false){return catalogSchema.parse(await authenticatedRequest(`${admin?'/admin/rewards':'/rewards'}?page=${page}&limit=12`));}
export async function saveReward(input:RewardInput,reward?:{rewardUUID:string;version:number}){
 return rewardSchema.parse(await authenticatedRequest(reward?`/admin/rewards/${reward.rewardUUID}`:'/admin/rewards',json(reward?'PUT':'POST',reward?{...input,version:reward.version}:input)));
}
export async function redeemReward(rewardUUID:string,requestUUID:string,expectedPointsCost:number){return redeemResultSchema.parse(await authenticatedRequest(`/rewards/${rewardUUID}/redeem`,json('POST',{requestUUID,expectedPointsCost})));}
export async function fetchRedemptions(page:number,status:RedemptionStatus,admin=false){return redemptionsSchema.parse(await authenticatedRequest(`${admin?'/admin/redemptions':'/rewards/redemptions'}?page=${page}&limit=10&status=${status}`));}
export async function deliverRedemption(uuid:string){return redemptionSchema.parse(await authenticatedRequest(`/admin/redemptions/${uuid}/deliver`,json('POST',{})));}
