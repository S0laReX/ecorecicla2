export async function registerAccount(body:FormData):Promise<string>{
 const response=await fetch('/api/auth/register',{method:'POST',body});
 const json:unknown=await response.json();
 if(!json||typeof json!=='object'||!('message'in json)||typeof json.message!=='string')throw new Error('Respuesta no válida del servidor.');
 if(!response.ok)throw new Error(json.message);return json.message;
}
