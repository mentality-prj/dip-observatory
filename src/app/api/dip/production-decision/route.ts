import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeDipBaseUrl } from "@/lib/dip-url";

const requestSchema = z.object({
  demandChangePct: z.number().min(-15).max(15),
  materialAvailabilityPct: z.number().min(50).max(100),
  productionCapacityPct: z.number().min(60).max(100),
  machineAvailabilityPct: z.number().min(70).max(100),
});

const workflow = {
  name: "production-decision-v0.1",
  default_decision: "Maintain current production plan",
  rules: [
    {
      rule: "CRITICAL_MATERIAL_AND_CAPACITY",
      decision: "Activate contingency production plan",
      conditions: [
        { feature: "material_availability_pct", operator: "<", value: 70 },
        { feature: "production_capacity_pct", operator: "<", value: 85 },
      ],
      actions: [{ kind: "activate_contingency", payload: { priority: "high" } }],
    },
    {
      rule: "MACHINE_FAILURE_RISK",
      decision: "Reroute production and protect critical orders",
      conditions: [
        { feature: "machine_availability_pct", operator: "<", value: 82 },
        { feature: "demand_change_pct", operator: ">", value: 5 },
      ],
      actions: [{ kind: "reroute_production", payload: { priority: "critical_orders" } }],
    },
    {
      rule: "CAPACITY_PRESSURE",
      decision: "Prepare additional production capacity",
      conditions: [
        { feature: "demand_change_pct", operator: ">=", value: 7 },
        { feature: "production_capacity_pct", operator: "<", value: 92 },
      ],
      actions: [{ kind: "prepare_capacity", payload: { lead_time_days: 14 } }],
    },
    {
      rule: "MATERIAL_PRESSURE",
      decision: "Reduce production exposure and secure material supply",
      conditions: [
        { feature: "material_availability_pct", operator: "<", value: 78 },
        { feature: "demand_change_pct", operator: ">", value: 3 },
      ],
      actions: [{ kind: "secure_material", payload: { priority: "high" } }],
    },
    {
      rule: "ELEVATED_DEMAND",
      decision: "Increase production buffer",
      conditions: [{ feature: "demand_change_pct", operator: ">=", value: 3 }],
      actions: [{ kind: "increase_buffer", payload: { target_pct: 8 } }],
    },
  ],
};

function getDipConfig() {
  const baseUrl = normalizeDipBaseUrl(
    process.env.DIP_API_BASE_URL ?? process.env.DIP_URL ?? process.env.NEXT_PUBLIC_DIP_API_BASE_URL,
  );
  const apiKey = (process.env.DIP_API_KEY ?? process.env.DIP_ADMIN_API_KEY ?? "").trim();
  return { baseUrl, apiKey };
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid production scenario", details: parsed.error.flatten() }, { status: 400 });
  }

  const { baseUrl, apiKey } = getDipConfig();
  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: "DIP API is not configured" }, { status: 503 });
  }

  const { demandChangePct, materialAvailabilityPct, productionCapacityPct, machineAvailabilityPct } = parsed.data;
  const features = {
    demand_change_pct: demandChangePct,
    material_availability_pct: materialAvailabilityPct,
    production_capacity_pct: productionCapacityPct,
    machine_availability_pct: machineAvailabilityPct,
  };

  try {
    const response = await fetch(`${baseUrl}/api/v1/decision/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ workflow, entity_id: "wsp-production-demonstrator", features }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({ detail: null }));
    if (!response.ok) {
      return NextResponse.json(
        { error: payload.detail ?? payload.error?.message ?? `DIP request failed (${response.status})` },
        { status: response.status },
      );
    }

    return NextResponse.json({ ...payload, features });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to reach DIP" },
      { status: 502 },
    );
  }
}
