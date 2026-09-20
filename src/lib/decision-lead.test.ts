import assert from "node:assert/strict";
import test from "node:test";
import { allowSubmission,decisionLeadSchema,GmailMailDelivery,isReplay } from "./decision-lead";

const valid={name:"Ada Lovelace",organization:"Example Org",email:"ada@example.org",decision:"Choose which recurring requests should receive limited resources.",information:"Requests and capacity",alternatives:"Fund, defer, reject",constraints:"Budget",context:"",locale:"en" as const,website:""};

test("accepts a valid decision inquiry",()=>{assert.equal(decisionLeadSchema.parse(valid).email,"ada@example.org")});
test("rejects missing required fields",()=>{assert.throws(()=>decisionLeadSchema.parse({...valid,organization:""}))});
test("rejects invalid email",()=>{assert.throws(()=>decisionLeadSchema.parse({...valid,email:"not-email"}))});
test("rejects oversized input",()=>{assert.throws(()=>decisionLeadSchema.parse({...valid,decision:"x".repeat(4001)}))});
test("rejects unexpected fields",()=>{assert.throws(()=>decisionLeadSchema.parse({...valid,admin:true}))});
test("honeypot must be empty",()=>{assert.throws(()=>decisionLeadSchema.parse({...valid,website:"bot"}))});
test("rate limit rejects the sixth request in a window",()=>{const key=`test-${Date.now()}`;for(let i=0;i<5;i++)assert.equal(allowSubmission(key),true);assert.equal(allowSubmission(key),false)});
test("duplicate payload is detected",()=>{const lead=decisionLeadSchema.parse({...valid,email:`${Date.now()}@example.org`});assert.equal(isReplay(lead),false);assert.equal(isReplay(lead),true)});

test("Gmail delivery sends through OAuth and Gmail API",async()=>{const old={...process.env};Object.assign(process.env,{GMAIL_CLIENT_ID:"id",GMAIL_CLIENT_SECRET:"secret",GMAIL_REFRESH_TOKEN:"refresh",GMAIL_FROM:"sender@example.org",QDIP_LEAD_MAILBOX:"leads@example.org"});const calls:string[]=[];const original=global.fetch;global.fetch=(async(input:RequestInfo|URL)=>{calls.push(String(input));return calls.length===1?new Response(JSON.stringify({access_token:"token"}),{status:200}):new Response(JSON.stringify({id:"message"}),{status:200})}) as typeof fetch;try{await new GmailMailDelivery().sendDecisionLead(decisionLeadSchema.parse(valid),"submission-1");assert.equal(calls.length,2);assert.match(calls[1],/gmail\.googleapis\.com/)}finally{global.fetch=original;process.env=old}});
test("Gmail delivery failure is surfaced without sending a real email",async()=>{Object.assign(process.env,{GMAIL_CLIENT_ID:"id",GMAIL_CLIENT_SECRET:"secret",GMAIL_REFRESH_TOKEN:"refresh",GMAIL_FROM:"sender@example.org",QDIP_LEAD_MAILBOX:"leads@example.org"});const original=global.fetch;global.fetch=(async()=>new Response("{}",{status:500})) as typeof fetch;try{await assert.rejects(()=>new GmailMailDelivery().sendDecisionLead(decisionLeadSchema.parse(valid),"submission-2"),/gmail_auth_failed/)}finally{global.fetch=original}});
