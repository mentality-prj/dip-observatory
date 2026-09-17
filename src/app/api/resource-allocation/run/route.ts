import { NextResponse } from "next/server";
import { z } from "zod";

import { DipApiError, runDipPlugin } from "@/lib/dip-api";

export const maxDuration = 60;

const priority = z.enum(["critical", "high", "normal"]);
const demand = z.object({ service: z.string().min(1), units: z.number().nonnegative(), priority: priority.default("normal"), program: z.string().nullable().optional() }).strict();
const community = z.object({ id: z.string().min(1), accessible: z.boolean().default(true), max_teams: z.number().int().nonnegative().default(30), demand: z.array(demand).default([]), accessibility: z.record(z.string(), z.boolean()).default({}), daily_demand: z.record(z.string(), z.array(demand)).default({}), allowed_programs: z.array(z.string()).nullable().optional() }).strict();
const team = z.object({ id: z.string().min(1), current_community: z.string().nullable().optional(), skills: z.array(z.string()).default([]), capacity: z.number().nonnegative().default(0), allowed_communities: z.array(z.string()).nullable().optional(), availability: z.record(z.string(), z.boolean()).default({}), daily_capacity: z.record(z.string(), z.number().nonnegative()).default({}), max_daily_capacity: z.number().nonnegative().nullable().optional(), max_travel_cost: z.number().nonnegative().nullable().optional(), max_travel_minutes: z.number().nonnegative().nullable().optional(), cost_per_capacity: z.number().nonnegative().default(0), programs: z.array(z.string()).default([]) }).strict();
const edge = z.object({ from: z.string().min(1), to: z.string().min(1), minutes: z.number().nonnegative().nullable().optional(), cost: z.number().nonnegative().default(0) }).strict();
const scenario = z.object({ unavailable_teams: z.array(z.string()).default([]), inaccessible_communities: z.array(z.string()).default([]), capacity_factor: z.number().nonnegative().nullable().optional() }).strict();
const requestSchema = z.object({ operation: z.enum(["optimize", "evaluate_manual", "simulate", "counterfactual", "capacity_gap"]).default("optimize"), communities: z.array(community).min(1).max(50), teams: z.array(team).min(1).max(30), travel_edges: z.array(edge).default([]), current_allocation: z.record(z.string(), z.string().nullable()).nullable().optional(), manual_allocation: z.record(z.string(), z.unknown()).nullable().optional(), baseline_allocation: z.record(z.string(), z.string().nullable()).nullable().optional(), planning_period: z.object({ days: z.array(z.string().min(1)).min(1).max(31) }).strict().nullable().optional(), scenario: scenario.nullable().optional(), budget: z.number().nonnegative().nullable().optional(), max_working_capacity_per_team: z.number().nonnegative().nullable().optional(), provenance: z.object({ source: z.string().min(1), imported_at: z.string().nullable().optional(), mapping_version: z.string().nullable().optional() }).strict().nullable().optional(), marginal_team_capacity: z.number().positive().default(16), target_priority_coverage: z.number().min(0).max(1).default(0.9) }).strict();

type UiLocale = "uk" | "en" | "pl";
const metricLabels: Record<UiLocale, Record<string, string>> = {
  uk: { priority_coverage: "покриття пріоритетних потреб", weighted_coverage: "зважене покриття потреб", total_coverage: "загальне покриття потреб", unmet_need: "непокриті потреби", capacity_utilization: "завантаження команд", travel_cost: "вартість переміщень", operating_cost: "операційна вартість", opening: "потреб на початку дня", served: "покрито потреб", closing_unmet: "залишилося без покриття" },
  en: { priority_coverage: "priority coverage", weighted_coverage: "weighted coverage", total_coverage: "total coverage", unmet_need: "unmet need", capacity_utilization: "team utilization", travel_cost: "movement cost", operating_cost: "operating cost", opening: "opening needs", served: "needs served", closing_unmet: "needs left uncovered" },
  pl: { priority_coverage: "pokrycie potrzeb priorytetowych", weighted_coverage: "ważone pokrycie potrzeb", total_coverage: "łączne pokrycie potrzeb", unmet_need: "niepokryte potrzeby", capacity_utilization: "wykorzystanie zespołów", travel_cost: "koszt przemieszczeń", operating_cost: "koszt operacyjny", opening: "potrzeby na początku dnia", served: "obsłużone potrzeby", closing_unmet: "potrzeby bez pokrycia" },
};
function requestLocale(request: Request): UiLocale { const language = request.headers.get("accept-language")?.toLowerCase() ?? ""; return language.startsWith("pl") ? "pl" : language.startsWith("en") ? "en" : "uk"; }
function evidenceText(value: unknown, locale: UiLocale): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return String(value ?? "");
  const item = value as Record<string, unknown>;
  const day = typeof item.day === "string" ? `${item.day}: ` : "";
  const metricKey = typeof item.metric === "string" ? item.metric : "evidence";
  const metric = metricLabels[locale][metricKey] ?? metricKey.replaceAll("_", " ");
  const rawValue = item.value;
  const percentage = ["priority_coverage", "weighted_coverage", "total_coverage", "capacity_utilization"].includes(metricKey) && typeof rawValue === "number";
  const metricValue = percentage ? ` = ${Math.round(rawValue * 100)}%` : typeof rawValue === "number" || typeof rawValue === "string" ? ` = ${rawValue}` : "";
  return `${day}${metric}${metricValue}`;
}
function visibleOutcomeKey(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "invalid";
  const plan = value as Record<string, unknown>;
  const metrics = plan.aggregate_metrics && typeof plan.aggregate_metrics === "object" ? plan.aggregate_metrics as Record<string, unknown> : {};
  const summary = plan.demand_summary && typeof plan.demand_summary === "object" ? plan.demand_summary as Record<string, unknown> : {};
  const priorityCoverage = typeof metrics.priority_coverage === "number" ? Math.round(metrics.priority_coverage * 100) : "na";
  return `${priorityCoverage}|${String(summary.served ?? "na")}|${String(summary.closing_unmet ?? "na")}`;
}
function distinctAlternatives(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const result = { ...(value as Record<string, unknown>) };
  if (!Array.isArray(result.alternatives)) return result;
  const seen = new Set<string>();
  result.alternatives = result.alternatives.filter((plan) => {
    const key = visibleOutcomeKey(plan);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 4);
  return result;
}
function normalizeEvidence(payload: Record<string, unknown>, locale: UiLocale): Record<string, unknown> {
  const normalizeResult = (value: unknown): unknown => { if (!value || typeof value !== "object" || Array.isArray(value)) return value; const result = { ...(distinctAlternatives(value) as Record<string, unknown>) }; if (Array.isArray(result.evidence)) result.evidence = result.evidence.map((item) => evidenceText(item, locale)); return result; };
  const normalized = { ...payload };
  if (normalized.operation === "simulate" && normalized.result) normalized.result = normalizeResult(normalized.result); else Object.assign(normalized, normalizeResult(normalized));
  return normalized;
}

export async function POST(request: Request) {
  try {
    const locale = requestLocale(request);
    const input = requestSchema.parse(await request.json());
    const output = await runDipPlugin("resource-allocation", "humanitarian.resource-allocation.optimize", input);
    return NextResponse.json(normalizeEvidence(output, locale));
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid resource-allocation state.", issues: error.issues }, { status: 422 });
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unexpected resource-allocation engine error." }, { status: 500 });
  }
}
