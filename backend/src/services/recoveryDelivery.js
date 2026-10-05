const fs=require('node:fs/promises');const path=require('node:path');const {randomUUID}=require('node:crypto');const nodemailer=require('nodemailer');
/** DELIVER PASSWORD RECOVERY LINK @param {string} email @param {string} link @returns {Promise<void>} */
exports.deliverRecovery=async(email,link)=>{
 const mode=process.env.RECOVERY_DELIVERY||'local';
 if(mode==='local'&&process.env.NODE_ENV!=='production'){
  const directory=path.resolve(__dirname,'../../.local/recovery');await fs.mkdir(directory,{recursive:true});
  await fs.writeFile(path.join(directory,`${Date.now()}-${randomUUID()}.txt`),`Destinatario: ${email}\nEnlace: ${link}\nVence en 20 minutos. Uso único.\n`,{mode:0o600,flag:'wx'});return;
 }
 if(mode!=='smtp'||!process.env.SMTP_HOST||!process.env.SMTP_FROM)throw new Error('Recovery delivery not configured');
 const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_PORT==='465',requireTLS:process.env.SMTP_PORT!=='465',auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}:undefined,connectionTimeout:10000,socketTimeout:15000});
 await transport.sendMail({from:process.env.SMTP_FROM,to:email,subject:'Recupera tu acceso a EcoRecicla',text:`Solicitaste cambiar tu contraseña. Abre este enlace, válido durante 20 minutos y para un solo uso:\n${link}\nSi no lo solicitaste, ignora este mensaje.`});
};
