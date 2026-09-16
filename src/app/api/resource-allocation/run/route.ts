import { NextResponse } from "next/server";
import { z } from "zod";

import { DipApiError, runDipPlugin } from "@/lib/dip-api";

const demand = z.object({ service: z.string().min(1), units: z.number().nonnegative(), priority: z.enum(["critical", "high", "normal"]) });
const community = z.object({ id: z.string().min(1), region: z.string().optional(), accessible: z.boolean().default(true), max_teams: z.number().int().positive().optional(), demand: z.array(demand) });
const team = z.object({ id: z.string().min(1), current_community: z.string().optional(), skills: z.array(z.string()), capacity: z.number().nonnegative(), allowed_communities: z.array(z.string()).optional() });
const edge = z.object({ from: z.string(), to: z.string(), minutes: z.number().nonnegative().optional(), cost: z.number().nonnegative().optional() });
const requestSchema = z.object({
  planning_period: z.object({ id: z.string(), label: z.string().optional() }).optional(),
  communities: z.array(community).min(1).max(20),
  teams: z.array(team).min(1).max(10),
  travel_edges: z.array(edge).optional(),
  current_allocation: z.record(z.string(), z.string().nullable()).optional(),
  synthetic: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    return NextResponse.json(await runDipPlugin("resource-allocation", "humanitarian.resource-allocation.optimize", input));
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid resource-allocation state." }, { status: 422 });
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unexpected resource-allocation engine error." }, { status: 500 });
  }
}
