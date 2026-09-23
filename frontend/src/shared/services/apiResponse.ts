/** Decode the official JSON contract without exposing proxy HTML or runtime errors. */
export class ApiRequestError extends Error {
  constructor(public readonly statusCode:number,public readonly errorCode:string,message:string) {
    super(message);
  }
}

export async function decodeApiResponse(response:Response,envelope=false):Promise<unknown> {
  let json:unknown;
  try { json=await response.json(); }
  catch {
    throw new ApiRequestError(response.status,response.status>=500?'SERVICE_UNAVAILABLE':'INVALID_RESPONSE',
      response.status>=500?'El servicio no está disponible. Intenta nuevamente en unos momentos.':'La respuesta recibida no es válida. Intenta nuevamente.');
  }
  const body=json&&typeof json==='object'?json as Record<string,unknown>:null;
  if(!response.ok) {
    const isOfficial=body?.success===false&&typeof body.message==='string'&&typeof body.errorCode==='string'&&body.statusCode===response.status;
    throw new ApiRequestError(response.status,isOfficial?body.errorCode as string:'HTTP_ERROR',
      isOfficial?body.message as string:'No se pudo completar la solicitud. Intenta nuevamente.');
  }
  if(!body||body.success!==true||!Object.hasOwn(body,'data'))
    throw new ApiRequestError(response.status,'INVALID_RESPONSE','La respuesta recibida no es válida. Intenta nuevamente.');
  return envelope?json:body.data;
}

export async function fetchApi(input:RequestInfo|URL,init?:RequestInit):Promise<Response> {
  try { return await fetch(input,init); }
  catch(error) {
    if(init?.signal?.aborted)throw error;
    throw new ApiRequestError(0,'NETWORK_UNAVAILABLE','No se pudo conectar con el servicio. Comprueba tu conexión e intenta nuevamente.');
  }
}
