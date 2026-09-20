import { NextRequest,NextResponse } from "next/server";
import { ZodError } from "zod";
import { allowSubmission,decisionLeadSchema,isReplay,submissionId,ZohoMailDelivery } from "@/lib/decision-lead";

export const runtime="nodejs";
const MAX_BODY_BYTES=18_000;
function clientKey(request:NextRequest){return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||request.headers.get("x-real-ip")||"unknown"}
export async function POST(request:NextRequest){
 const id=submissionId(),locale=request.headers.get("accept-language")?.slice(0,2)||"unknown";
 try{
  if(request.headers.get("content-length")&&Number(request.headers.get("content-length"))>MAX_BODY_BYTES)return NextResponse.json({error:"invalid"},{status:413});
  if(!allowSubmission(clientKey(request))){console.warn("decision_inquiry",{submissionId:id,status:"rate_limited",locale});return NextResponse.json({error:"rate_limited"},{status:429});}
  const raw=await request.text(); if(Buffer.byteLength(raw,"utf8")>MAX_BODY_BYTES)return NextResponse.json({error:"invalid"},{status:413});
  let json:unknown;try{json=JSON.parse(raw)}catch{return NextResponse.json({error:"invalid"},{status:400})}
  const lead=decisionLeadSchema.parse(json);
  if(lead.website){console.warn("decision_inquiry",{submissionId:id,status:"honeypot",locale:lead.locale});return NextResponse.json({ok:true},{status:200});}
  if(isReplay(lead)){console.warn("decision_inquiry",{submissionId:id,status:"duplicate",locale:lead.locale});return NextResponse.json({ok:true},{status:200});}
  await new ZohoMailDelivery().sendDecisionLead(lead,id);
  console.info("decision_inquiry",{submissionId:id,status:"sent",locale:lead.locale});
  return NextResponse.json({ok:true,id},{status:200});
 }catch(error){
  if(error instanceof ZodError)return NextResponse.json({error:"invalid"},{status:400});
  console.error("decision_inquiry",{submissionId:id,status:"delivery_error",locale,errorCategory:error instanceof Error?error.message:"unknown"});
  return NextResponse.json({error:"delivery_failed"},{status:502});
 }
}
