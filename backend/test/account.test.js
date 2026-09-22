const {test}=require('node:test');const assert=require('node:assert/strict');
const {registerSchema}=require('../src/schemas/authSchema');
const {hashPassword,verifyPassword}=require('../src/services/passwordService');
const {validateDocument}=require('../src/services/accountService');
const {PDFDocument}=require('pdf-lib');
test('registration rejects privilege injection and weak passwords',()=>{
 const account={displayName:'Test User',email:'test@example.com',password:'ValidPassword123',roleCode:'USER'};
 assert.equal(registerSchema.safeParse(account).success,true);
 for(const change of [{roleCode:'ADMIN'},{verificationStatus:'APPROVED'},{password:'short'},{roleCode:'COMPANY'}])assert.equal(registerSchema.safeParse({...account,...change}).success,false);
});
test('salted scrypt hashes verify without storing cleartext',async()=>{
 const first=await hashPassword('ValidPassword123');const second=await hashPassword('ValidPassword123');
 assert.notEqual(first,second);assert.ok(await verifyPassword('ValidPassword123',first));assert.equal(await verifyPassword('WrongPassword123',first),false);
});
test('company document requires actual parsable PDF or image',async()=>{
 const pdf=await PDFDocument.create();pdf.addPage();const buffer=Buffer.from(await pdf.save());
 assert.equal((await validateDocument({buffer,size:buffer.length})).documentMime,'application/pdf');
 await assert.rejects(validateDocument({buffer:Buffer.from('%PDF-fake'),size:9}),{errorCode:'DOCUMENT_INVALID'});
});
