const {z}=require('zod');
const emailSchema=z.string().trim().email().max(254).transform(value=>value.toLowerCase());
const passwordSchema=z.string().min(12).max(128).regex(/[A-Za-z]/).regex(/[0-9]/);
const base={displayName:z.string().trim().min(2).max(120),email:emailSchema,password:passwordSchema};
const registerSchema=z.discriminatedUnion('roleCode',[
 z.object({...base,roleCode:z.literal('USER')}).strict(),
 z.object({...base,roleCode:z.literal('COMPANY'),taxIdentifier:z.string().trim().regex(/^[A-Za-z0-9-]{4,40}$/),contactName:z.string().trim().min(2).max(120),coverageArea:z.string().trim().min(3).max(300)}).strict()
]);
const loginSchema=z.object({email:emailSchema,password:z.string().min(1).max(128)}).strict();
module.exports={registerSchema,emailSchema,passwordSchema,loginSchema};
