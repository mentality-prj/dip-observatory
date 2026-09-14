export type JsonSchema = {
  type?: string; title?: string; description?: string; default?: unknown;
  properties?: Record<string, JsonSchema>; required?: string[]; items?: JsonSchema;
  enum?: unknown[]; minimum?: number; maximum?: number; minLength?: number;
  minItems?: number; additionalProperties?: boolean | JsonSchema;
  $ref?: string; $defs?: Record<string, JsonSchema>;
};

export type Dimension = {
  id: string; name: string; version: string; type: string; source: string;
  evaluator_id: string; evaluator_version: string; blocking: boolean; required: boolean;
  configuration_schema: JsonSchema; value_schema: JsonSchema;
};

export type Binding = {
  id: string; version: string; plugin_id: string; plugin_version: string;
  capability_id: string; capability_version: string; dimension_id: string;
  dimension_version: string; source_path: string; mapping: Record<string, string> | null;
  required: boolean; enabled: boolean;
};

export type Plugin = {
  name: string; version: string; enabled: boolean; description?: string;
  capabilities: string[]; capability_versions: Record<string, string>;
  dimension_outputs: { dimension_id: string; capability_id: string; source_path: string;
    value_schema: JsonSchema; description: string }[];
  dimension_bindings: Binding[]; ui: { label?: string; category?: string };
};

export type ProfileDimension = {
  dimension_id: string; version: string; required: boolean; weight: number;
  configuration: Record<string, unknown>; binding_id: string | null; binding_version: string | null;
};

export type Profile = {
  id: string; name: string; version: string; plugin_id: string; plugin_version: string;
  capability_id: string; capability_version: string; active: boolean;
  alternatives: { id: string; label: string; attributes: Record<string, unknown> }[];
  dimensions: ProfileDimension[]; context_schema: JsonSchema; metadata: Record<string, unknown>;
};

export type ProfileView = Profile & {
  validation: { status: "VALID" | "INVALID"; errors: string[]; warnings: string[] };
};

export type DimensionResult = {
  dimension_id: string; status: string; value: unknown; score: number | null;
  passed: boolean | null; blocking: boolean; evidence: unknown[];
  explanation: string[]; required_actions: string[]; findings: unknown[];
};

export type Audit = {
  decision_id: string; timestamp: string; profile_version: string; profile: Profile;
  selected_alternative: string | null; status: string; explanation: string[];
  dimension_results: { alternative_id: string; feasible: boolean; score: number | null;
    rank: number | null; dimensions: DimensionResult[] }[];
  plugin_versions: Record<string, string>; capability_versions: Record<string, string>;
  dimension_versions: Record<string, string>; evaluator_versions: Record<string, string>;
  binding_versions: Record<string, string>;
};

export async function studioRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/studio/${path}`, {
    ...init, headers: { "Content-Type": "application/json", ...init?.headers }, cache: "no-store",
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json();
  if (!response.ok) throw new Error(typeof body.detail === "string" ? body.detail :
    typeof body.error === "string" ? body.error : JSON.stringify(body.detail ?? body));
  return body as T;
}

export function emptyProfile(plugin?: Plugin): Profile {
  const capability = plugin?.capabilities[0] ?? "";
  return {
    id: "", name: "", version: "1.0", plugin_id: plugin?.name ?? "",
    plugin_version: plugin?.version ?? "", capability_id: capability,
    capability_version: plugin?.capability_versions[capability] ?? "", active: false,
    alternatives: [{ id: "alternative-1", label: "Alternative 1", attributes: {} }],
    dimensions: [], context_schema: { type: "object", properties: {} }, metadata: {},
  };
}
