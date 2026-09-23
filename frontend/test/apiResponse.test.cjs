const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
// Compile the isolated, dependency-free transport module without modifying source files.
const source=fs.readFileSync(path.join(__dirname,'../src/shared/services/apiResponse.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const loaded={exports:{}};new Function('module','exports',compiled)(loaded,loaded.exports);
const {decodeApiResponse,fetchApi}=loaded.exports;
test('proxy HTML 500/502 is reported as unavailable without exposing HTML',async()=>{
 for(const status of [500,502,503,504])await assert.rejects(decodeApiResponse(new Response('<html>ECONNREFUSED INTERNAL</html>',{status})),error=>error.errorCode==='SERVICE_UNAVAILABLE'&&!error.message.includes('INTERNAL'));
});
test('official errors and collection metadata are preserved',async()=>{
 await assert.rejects(decodeApiResponse(Response.json({success:false,message:'Correo o contraseña incorrectos.',errorCode:'INVALID_CREDENTIALS',statusCode:401},{status:401})),{statusCode:401,errorCode:'INVALID_CREDENTIALS'});
 const body={success:true,data:[],meta:{total:0,page:1,limit:6}};
 assert.deepEqual(await decodeApiResponse(Response.json(body),true),body);
});
test('invalid JSON and malformed success are rejected safely',async()=>{
 await assert.rejects(decodeApiResponse(new Response('broken')),{errorCode:'INVALID_RESPONSE'});
 await assert.rejects(decodeApiResponse(Response.json({success:true})),{errorCode:'INVALID_RESPONSE'});
});
test('network failure is translated but cancellation is preserved',async()=>{
 const original=global.fetch;const failure=new TypeError('fetch failed');global.fetch=async()=>{throw failure;};
 try{await assert.rejects(fetchApi('/api/auth/login'),{errorCode:'NETWORK_UNAVAILABLE',statusCode:0});const controller=new AbortController();controller.abort();await assert.rejects(fetchApi('/api/auth/login',{signal:controller.signal}),error=>error===failure);}
 finally{global.fetch=original;}
});
