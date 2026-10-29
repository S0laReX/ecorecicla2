const {test}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const request=require('supertest');

test('auth and registration enforce independent per-IP minute budgets before parsing',async()=>{
 const controller=require('../src/controllers/authController');
 const original={...controller};let loginCalls=0,registrationCalls=0;
 controller.authenticateUser=async(_req,res)=>{loginCalls++;res.sendStatus(204);};
 controller.refreshUserSession=async(_req,res)=>{loginCalls++;res.sendStatus(204);};
 controller.registerUser=async(_req,res)=>{registrationCalls++;res.sendStatus(204);};
 try{
  const app=express();app.use('/api/auth',require('../src/routes/authRoutes'));
  // Malformed bodies consume the same budget, before expensive authentication.
  assert.equal((await request(app).post('/api/auth/login').set('Content-Type','application/json').send('{')).status,400);
  for(let i=0;i<19;i++)assert.equal((await request(app).post(`/api/auth/login?authorize=${i}`).send({})).status,204);
  const blocked=await request(app).post('/api/auth/login?authorize=new').send({});
  assert.equal(blocked.status,429);assert.equal(blocked.body.errorCode,'RATE_LIMITED');assert.equal(blocked.body.statusCode,429);
  assert.ok(Number(blocked.headers['retry-after'])>0);assert.ok(blocked.headers.ratelimit);assert.equal(loginCalls,19);
  assert.equal((await request(app).post('/api/auth/refresh').send({})).status,429);
  // A supplied forwarding header cannot bypass the default untrusted-proxy policy.
  assert.equal((await request(app).post('/api/auth/login').set('X-Forwarded-For','203.0.113.1').send({})).status,429);
  for(let i=0;i<100;i++)assert.equal((await request(app).post(`/api/auth/register?attempt=${i}`).field('roleCode',i%2?'USER':'COMPANY')).status,204);
  const registrationBlocked=await request(app).post('/api/auth/register?attempt=new').field('roleCode','USER');
  assert.equal(registrationBlocked.status,429);assert.equal(registrationCalls,100);
  assert.ok(Number(registrationBlocked.headers['retry-after'])>0);
 }finally{Object.assign(controller,original);}
});
