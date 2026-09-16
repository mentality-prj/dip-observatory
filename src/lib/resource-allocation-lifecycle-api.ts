import "server-only";

import { z } from "zod";

import { normalizeDipBaseUrl } from "@/lib/dip-url";

export class ResourceAllocationLifecycleReadError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ResourceAllocationLifecycleReadError";
    this.status = status;
  }
}

const feedbackSchema = z.object({
  status: z.enum(["accepted", "modified", "rejected"]),
  reason: z.string().nullable().optional(),
  timestamp: z.string(),
  actor_id: z.string().optional(),
  selected: z.record(z.string(), z.unknown()).nullable().optional(),
}).passthrough();

const outcomeSchema = z.object({
  actual_allocation: z.record(z.string(), z.unknown()),
  metrics: z.record(z.string(), z.number()).default({}),
  notes: z.string().nullable().optional(),
  recorded_at: z.string(),
  actor_id: z.string().optional(),
}).passthrough();

export const resourceAllocationDecisionSchema = z.object({
  decision_id: z.string(),
  status: z.enum(["proposed", "accepted", "modified", "rejected", "completed"]),
  state_hash: z.string(),
  input_version: z.string(),
  engine_version: z.string(),
  plugin_version: z.string(),
  created_at: z.string(),
  selected: z.record(z.string(), z.unknown()),
  recommendation: z.record(z.string(), z.unknown()),
  evidence: z.array(z.unknown()).default([]),
  provenance: z.record(z.string(), z.unknown()).nullable().optional(),
  manager_selected: z.record(z.string(), z.unknown()).nullable().optional(),
  feedback: z.array(feedbackSchema).default([]),
  outcomes: z.array(outcomeSchema).default([]),
}).passthrough();

export type ResourceAllocationDecision = z.infer<typeof resourceAllocationDecisionSchema>;

export async function getResourceAllocationDecision(decisionId: string): Promise<ResourceAllocationDecision> {
  const baseUrl = normalizeDipBaseUrl(process.env.DIP_API_BASE_URL ?? process.env.DIP_URL ?? process.env.NEXT_PUBLIC_DIP_API_BASE_URL ?? "");
  const apiKey = (process.env.DIP_API_KEY ?? process.env.DIP_ADMIN_API_KEY ?? "").trim();
  if (!baseUrl || !apiKey) throw new ResourceAllocationLifecycleReadError("DIP API is not configured.", 503);

  const response = await fetch(`${baseUrl}/api/v1/resource-allocation/decisions/${encodeURIComponent(decisionId)}`, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });
  if (!response.ok) {
    let message = `DIP request failed with status ${response.status}`;
    try {
      const payload = await response.json() as { detail?: string };
      if (typeof payload.detail === "string") message = payload.detail;
    } catch {}
    throw new ResourceAllocationLifecycleReadError(message, response.status);
  }
  return resourceAllocationDecisionSchema.parse(await response.json());
}
