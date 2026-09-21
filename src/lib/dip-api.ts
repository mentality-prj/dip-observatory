import 'server-only'

import { z } from 'zod'

import {
  importTemplateSchema,
  importValidationSchema,
  pipelineRunSchema,
  type ProspectSeed,
} from '@/features/gtm-lab/import-contracts'
import { normalizeDipBaseUrl } from '@/lib/dip-url'

class DipApiError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.name = 'DipApiError'
    this.status = status
  }
}

function getDipBaseUrl() {
  const raw = process.env.DIP_API_BASE_URL ?? process.env.DIP_URL ?? process.env.NEXT_PUBLIC_DIP_API_BASE_URL ?? ''
  return normalizeDipBaseUrl(raw)
}
function getDipApiKey() {
  return (process.env.DIP_API_KEY ?? process.env.DIP_ADMIN_API_KEY ?? '').trim()
}
function buildDipUrl(path: string) {
  return `${getDipBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
}

async function parseResponse<T>(response: Response, schema: z.ZodType<T>) {
  if (!response.ok) {
    let message = `DIP request failed with status ${response.status}`
    try {
      const payload = (await response.json()) as { detail?: string | { code?: string }; error?: { message?: string } }
      message =
        typeof payload.detail === 'string'
          ? payload.detail
          : (payload.detail?.code ?? payload.error?.message ?? message)
    } catch {}
    throw new DipApiError(message, response.status)
  }
  return schema.parse(await response.json())
}

async function dipFetch<T>(path: string, schema: z.ZodType<T>, init?: RequestInit) {
  const apiKey = getDipApiKey()
  const baseUrl = getDipBaseUrl()
  if (!baseUrl || !apiKey)
    throw new DipApiError('DIP API is not configured. Set DIP_API_BASE_URL and DIP_API_KEY.', 503)
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('x-api-key', apiKey)
  const response = await fetch(buildDipUrl(path), { ...init, headers, cache: 'no-store' })
  return parseResponse(response, schema)
}

export function getDipConnectionState() {
  const baseUrl = getDipBaseUrl()
  const apiKey = getDipApiKey()
  return { configured: Boolean(baseUrl && apiKey), baseUrl: baseUrl || null }
}

export async function runDipPlugin(
  pluginName: string,
  capabilityId: string,
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const response = await dipFetch(
    `/api/v1/plugins/${pluginName}/execute`,
    z.object({ result: z.record(z.string(), z.unknown()) }),
    {
      method: 'POST',
      body: JSON.stringify({
        capability_id: capabilityId,
        input,
        config: {},
        metadata: { source: 'dip-observatory' },
        features: input,
      }),
    }
  )
  return response.result
}

export function getGtmImportTemplate() {
  return dipFetch('/api/v1/gtm-lab/imports/template', importTemplateSchema)
}

export function validateGtmImport(rows: Record<string, unknown>[]) {
  return dipFetch('/api/v1/gtm-lab/imports/validate', importValidationSchema, {
    method: 'POST',
    body: JSON.stringify({ rows }),
  })
}

export function runGtmPipeline(rows: ProspectSeed[]) {
  return dipFetch('/api/v1/gtm-lab/pipeline/run', pipelineRunSchema, {
    method: 'POST',
    body: JSON.stringify({ connector_ids: ['inline-prospects'], ingestion_request: { rows } }),
  })
}

const lifecycleMutationSchema = z.object({ decision_id: z.string(), status: z.string() })
const lifecycleCreateSchema = z.object({
  decision_id: z.string(),
  status: z.string(),
  result: z.record(z.string(), z.unknown()),
})

export function createResourceAllocationDecision(input: Record<string, unknown>) {
  return dipFetch('/api/v1/resource-allocation/decisions', lifecycleCreateSchema, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function recordResourceAllocationFeedback(decisionId: string, feedback: Record<string, unknown>) {
  return dipFetch(
    `/api/v1/resource-allocation/decisions/${encodeURIComponent(decisionId)}/feedback`,
    lifecycleMutationSchema,
    { method: 'POST', body: JSON.stringify(feedback) }
  )
}

export function recordResourceAllocationOutcome(decisionId: string, outcome: Record<string, unknown>) {
  return dipFetch(
    `/api/v1/resource-allocation/decisions/${encodeURIComponent(decisionId)}/outcomes`,
    lifecycleMutationSchema,
    { method: 'POST', body: JSON.stringify(outcome) }
  )
}

export { DipApiError }
