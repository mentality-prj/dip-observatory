/** V2 is compilation-only; this browser never infers feasibility or economics. */
export type RREconomicPreflight = {
  schema_version: 'readiness-recovery.economic-preflight.v2'
  economic_version: 'readiness-recovery.economic-state.v2'
  decision_id: string
  ir_semantic_hash: string
  job_count: number
  asset_count: number
  procurement_offer_count: number
  donor_extraction_count: number
  state: 'COMPILED_PREVIEW_ONLY'
  actionable: false
  supply_source_verified: false
  atomic_plan_committed: false
}

const idPattern = /^[A-Za-z0-9_.-]{1,128}$/
const digestPattern = /^[a-f0-9]{64}$/
const expectedKeys = [
  'schema_version',
  'economic_version',
  'decision_id',
  'ir_semantic_hash',
  'job_count',
  'asset_count',
  'procurement_offer_count',
  'donor_extraction_count',
  'state',
  'actionable',
  'supply_source_verified',
  'atomic_plan_committed',
] as const

export function economicRequestDecisionId(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const request = value as { operational?: unknown }
  if (!request.operational || typeof request.operational !== 'object' || Array.isArray(request.operational))
    return null
  const { decision_id: id } = request.operational as { decision_id?: unknown }
  return typeof id === 'string' && idPattern.test(id) && !['.', '..'].includes(id) ? id : null
}

export function isRREconomicPreflight(value: unknown): value is RREconomicPreflight {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const v = value as Partial<RREconomicPreflight>
  if (Object.keys(value).length !== expectedKeys.length || expectedKeys.some((key) => !(key in v))) return false
  const count = (n: unknown, min: number) => Number.isSafeInteger(n) && typeof n === 'number' && n >= min
  return (
    v.schema_version === 'readiness-recovery.economic-preflight.v2' &&
    v.economic_version === 'readiness-recovery.economic-state.v2' &&
    typeof v.decision_id === 'string' &&
    idPattern.test(v.decision_id) &&
    !['.', '..'].includes(v.decision_id) &&
    typeof v.ir_semantic_hash === 'string' &&
    digestPattern.test(v.ir_semantic_hash) &&
    count(v.job_count, 1) &&
    count(v.asset_count, 1) &&
    count(v.procurement_offer_count, 0) &&
    count(v.donor_extraction_count, 0) &&
    v.state === 'COMPILED_PREVIEW_ONLY' &&
    v.actionable === false &&
    v.supply_source_verified === false &&
    v.atomic_plan_committed === false
  )
}
