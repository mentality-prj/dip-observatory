import assert from "node:assert/strict";
import test from "node:test";
import { allowSubmission,decisionLeadSchema,isReplay,type SmtpTransport,ZohoMailDelivery } from "./decision-lead";

const valid={name:"Ada Lovelace",organization:"Example Org",email:"ada@example.org",decision:"Choose which recurring requests should receive limited resources.",information:"Requests and capacity",alternatives:"Fund, defer, reject",constraints:"Budget",context:"",locale:"en" as const,website:""};

test("accepts a valid decision inquiry",()=>{assert.equal(decisionLeadSchema.parse(valid).email,"ada@example.org")});
test("rejects missing required fields",()=>{assert.throws(()=>decisionLeadSchema.parse({...valid,organization:""}))});
test("rejects invalid email",()=>{assert.throws(()=>decisionLeadSchema.parse({...valid,email:"not-email"}))});
test("rejects oversized input",()=>{assert.throws(()=>decisionLeadSchema.parse({...valid,decision:"x".repeat(4001)}))});
test("rejects unexpected fields",()=>{assert.throws(()=>decisionLeadSchema.parse({...valid,admin:true}))});
test("honeypot must be empty",()=>{assert.throws(()=>decisionLeadSchema.parse({...valid,website:"bot"}))});
test("rate limit rejects the sixth request in a window",()=>{const key=`test-${Date.now()}`;for(let i=0;i<5;i++)assert.equal(allowSubmission(key),true);assert.equal(allowSubmission(key),false)});
test("duplicate payload is detected",()=>{const lead=decisionLeadSchema.parse({...valid,email:`${Date.now()}@example.org`});assert.equal(isReplay(lead),false);assert.equal(isReplay(lead),true)});

test("Zoho delivery uses SMTP boundary without sending real email",async()=>{const old={...process.env};Object.assign(process.env,{ZOHO_SMTP_USER:"hello@qdip.ai",ZOHO_SMTP_PASSWORD:"app-password",QDIP_LEAD_MAILBOX:"hello@qdip.ai"});let captured="";const transport:SmtpTransport={send:async message=>{captured=message}};try{await new ZohoMailDelivery(transport).sendDecisionLead(decisionLeadSchema.parse(valid),"submission-1");assert.match(captured,/From: QDIP <hello@qdip\.ai>/);assert.match(captured,/To: hello@qdip\.ai/);assert.match(captured,/Reply-To: ada@example\.org/);assert.match(captured,/QDIP decision inquiry/)}finally{process.env=old}});
test("Zoho delivery failure is surfaced without sending a real email",async()=>{const old={...process.env};Object.assign(process.env,{ZOHO_SMTP_USER:"hello@qdip.ai",ZOHO_SMTP_PASSWORD:"app-password",QDIP_LEAD_MAILBOX:"hello@qdip.ai"});const transport:SmtpTransport={send:async()=>{throw new Error("smtp_delivery_failed")}};try{await assert.rejects(()=>new ZohoMailDelivery(transport).sendDecisionLead(decisionLeadSchema.parse(valid),"submission-2"),/smtp_delivery_failed/)}finally{process.env=old}});
