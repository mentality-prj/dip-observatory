import { NextResponse } from "next/server";
import { z } from "zod";

import { DipApiError, runDipPlugin } from "@/lib/dip-api";

const priority = z.enum(["critical", "high", "normal"]);
const demand = z.object({ service: z.string().min(1), units: z.number().nonnegative(), priority: priority.default("normal"), program: z.string().nullable().optional() }).strict();
const community = z.object({
  id: z.string().min(1), accessible: z.boolean().default(true), max_teams: z.number().int().nonnegative().default(30), demand: z.array(demand).default([]),
  accessibility: z.record(z.string(), z.boolean()).default({}), daily_demand: z.record(z.string(), z.array(demand)).default({}), allowed_programs: z.array(z.string()).nullable().optional(),
}).strict();
const team = z.object({
  id: z.string().min(1), current_community: z.string().nullable().optional(), skills: z.array(z.string()).default([]), capacity: z.number().nonnegative().default(0),
  allowed_communities: z.array(z.string()).nullable().optional(), availability: z.record(z.string(), z.boolean()).default({}), daily_capacity: z.record(z.string(), z.number().nonnegative()).default({}),
  max_daily_capacity: z.number().nonnegative().nullable().optional(), max_travel_cost: z.number().nonnegative().nullable().optional(), max_travel_minutes: z.number().nonnegative().nullable().optional(),
  cost_per_capacity: z.number().nonnegative().default(0), programs: z.array(z.string()).default([]),
}).strict();
const edge = z.object({ from: z.string().min(1), to: z.string().min(1), minutes: z.number().nonnegative().nullable().optional(), cost: z.number().nonnegative().default(0) }).strict();
const scenario = z.object({ unavailable_teams: z.array(z.string()).default([]), inaccessible_communities: z.array(z.string()).default([]), capacity_factor: z.number().nonnegative().nullable().optional() }).strict();
const requestSchema = z.object({
  operation: z.enum(["optimize", "evaluate_manual", "simulate", "counterfactual", "capacity_gap"]).default("optimize"),
  communities: z.array(community).min(1).max(50), teams: z.array(team).min(1).max(30), travel_edges: z.array(edge).default([]),
  current_allocation: z.record(z.string(), z.string().nullable()).nullable().optional(), manual_allocation: z.record(z.string(), z.unknown()).nullable().optional(), baseline_allocation: z.record(z.string(), z.string().nullable()).nullable().optional(),
  planning_period: z.object({ days: z.array(z.string().min(1)).min(1).max(31) }).strict().nullable().optional(), scenario: scenario.nullable().optional(), budget: z.number().nonnegative().nullable().optional(),
  max_working_capacity_per_team: z.number().nonnegative().nullable().optional(), provenance: z.object({ source: z.string().min(1), imported_at: z.string().nullable().optional(), mapping_version: z.string().nullable().optional() }).strict().nullable().optional(),
  marginal_team_capacity: z.number().positive().default(16), target_priority_coverage: z.number().min(0).max(1).default(0.9),
}).strict();

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    return NextResponse.json(await runDipPlugin("resource-allocation", "humanitarian.resource-allocation.optimize", input));
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid resource-allocation state.", issues: error.issues }, { status: 422 });
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unexpected resource-allocation engine error." }, { status: 500 });
  }
}
