import { NextResponse } from "next/server";
import { z } from "zod";

import { DipApiError, runDipPlugin } from "@/lib/dip-api";

const score = z.number().min(0).max(1).nullable().optional();
const customerSchema = z.object({
  customer_id: z.string().min(1), company_name: z.string().min(1), website: z.string().nullable().optional(),
  country: z.string().min(2), industry: z.string().min(1), employee_count: z.number().int().nonnegative().nullable().optional(),
  revenue_eur: z.number().nonnegative().nullable().optional(), decision_process_intensity: score,
  manual_process_level: score, data_availability: score, ai_maturity: score,
  existing_decision_system: z.boolean().nullable().optional(), problem_evidence_strength: z.number().min(0).max(1),
  estimated_problem_cost_eur: z.number().nonnegative().nullable().optional(), expected_dip_impact: score,
  decision_maker_identified: z.boolean().default(false), decision_maker_role: z.string().nullable().optional(),
  contact_available: z.boolean().default(false), previous_contact: z.boolean().default(false),
  response_status: z.enum(["none", "no_response", "interested", "rejected", "meeting", "pilot"]).default("none"),
  strategic_fit: z.number().min(0).max(1), notes: z.string().nullable().optional(), evidence: z.array(z.object({
    type: z.enum(["company_website", "job_posting", "annual_report", "news", "linkedin", "manual_research", "previous_contact"]),
    url: z.string().nullable().optional(), statement: z.string(), observed_at: z.string().nullable().optional(), confidence: z.number().min(0).max(1),
  })).default([]),
});
const requestSchema = z.object({ customers: z.array(customerSchema).min(1).max(10000) });

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    return NextResponse.json(await runDipPlugin("customer-opportunity", "customer-opportunity-evaluation", input));
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid customer opportunity data.", issues: error.issues }, { status: 422 });
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected opportunity evaluation error." }, { status: 500 });
  }
}
