import {z} from 'zod';
export const emailSchema=z.string().trim().email('Escribe un correo válido.').max(254).transform(value=>value.toLowerCase());
export const passwordSchema=z.string().min(12,'Usa al menos 12 caracteres.').max(128).regex(/[A-Za-z]/,'Incluye letras.').regex(/[0-9]/,'Incluye números.');
export const registrationSchema=z.object({displayName:z.string().trim().min(2).max(120),email:emailSchema,password:passwordSchema,roleCode:z.enum(['USER','COMPANY']),taxIdentifier:z.string().optional(),contactName:z.string().optional(),coverageArea:z.string().optional()}).strict().superRefine((v,ctx)=>{
 if(v.roleCode==='COMPANY')for(const [key,valid]of Object.entries({taxIdentifier:/^[A-Za-z0-9-]{4,40}$/.test(v.taxIdentifier||''),contactName:(v.contactName?.trim().length||0)>=2,coverageArea:(v.coverageArea?.trim().length||0)>=3}))if(!valid)ctx.addIssue({code:'custom',path:[key],message:'Completa este dato empresarial.'});
});
