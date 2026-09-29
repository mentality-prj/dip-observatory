import 'server-only'

import { normalizeDipBaseUrl } from '@/lib/dip-url'

import {
  compiledResourceAllocationSchema,
  normalizeContractResponse,
  normalizeIntakeAnalysis,
} from '../model/contracts'
import type { CausalSpecification, ContractResponse, IntakeAnalysis } from '../model/contracts'

export class DecisionIntakeApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'DecisionIntakeApiError'
  }
}

function connection() {
  const baseUrl = normalizeDipBaseUrl(
    process.env.DIP_API_BASE_URL ?? process.env.DIP_URL ?? process.env.NEXT_PUBLIC_DIP_API_BASE_URL ?? ''
  )
  const apiKey = (process.env.DIP_API_KEY ?? process.env.DIP_ADMIN_API_KEY ?? '').trim()
  if (!baseUrl || !apiKey) {
    throw new DecisionIntakeApiError('QDIP Decision Intake is not configured.', 503)
  }
  return { baseUrl, apiKey }
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  const { baseUrl, apiKey } = connection()
  let response: Response
  try {
    response = await fetch(`${baseUrl}/api/v1/intake${path}`, {
      ...init,
      headers: { 'x-api-key': apiKey, ...init.headers },
      cache: 'no-store',
      signal: AbortSignal.timeout(120_000),
    })
  } catch {
    throw new DecisionIntakeApiError('QDIP Decision Intake is unavailable.', 502)
  }
  if (!response.ok) {
    let detail = `Decision Intake failed with status ${response.status}`
    try {
      const payload = (await response.json()) as { detail?: string }
      if (payload.detail) detail = payload.detail
    } catch {
      // Preserve the status-derived error without exposing upstream response bodies.
    }
    throw new DecisionIntakeApiError(detail, response.status)
  }
  return response.json()
}

function isMissingV2Route(error: unknown): error is DecisionIntakeApiError {
  return error instanceof DecisionIntakeApiError && error.status === 404 && error.message === 'Not Found'
}

async function requestV2WithFallback(v2Path: string, v1Path: string, init: RequestInit = {}): Promise<unknown> {
  try {
    return await request(v2Path, init)
  } catch (error) {
    if (!isMissingV2Route(error)) throw error
    return request(v1Path, init)
  }
}

export async function analyzeDecisionDataset(input: { file: File; businessContext?: string }): Promise<IntakeAnalysis> {
  const form = new FormData()
  form.set('file', input.file)
  if (input.businessContext?.trim()) {
    form.set('business_context', input.businessContext.trim())
  }
  return normalizeIntakeAnalysis(await requestV2WithFallback('/v2/analyze', '/analyze', { method: 'POST', body: form }))
}

export async function submitDecisionIntakeAnswers(
  sessionId: string,
  input: {
    candidate_statuses?: Record<string, string>
    information_availability?: Record<string, string>
    semantic_mappings?: Record<string, string>
    archetype?: string
    causal_specification?: CausalSpecification
  }
): Promise<ContractResponse> {
  if (input.candidate_statuses_by_id && input.candidate_statuses) {
    throw new DecisionIntakeApiError('Use one semantic confirmation identity mode.', 422)
  }
  const encoded = encodeURIComponent(sessionId)
  const v2Path = `/v2/${encoded}/answers`
  try {
    return normalizeContractResponse(
      await request(v2Path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      })
    )
  } catch (error) {
    if (!isMissingV2Route(error)) throw error
  }

  if (input.semantic_mappings?.length) {
    throw new DecisionIntakeApiError('Human semantic mapping requires Decision Intake v2.', 409)
  }

  const legacyContract = normalizeContractResponse(await request(`/${encoded}/contract`))
  const fieldCounts = new Map<string, number>()
  for (const candidate of legacyContract.contract.candidates) {
    fieldCounts.set(candidate.field, (fieldCounts.get(candidate.field) ?? 0) + 1)
  }

  const legacyStatuses: Record<string, string> = {}
  for (const [field, status] of Object.entries(input.candidate_statuses ?? {})) {
    if ((fieldCounts.get(field) ?? 0) !== 1) {
      throw new DecisionIntakeApiError(
        'Legacy field-only semantic confirmation is ambiguous and requires Decision Intake v2.',
        409
      )
    }
    legacyStatuses[field] = status
  }
  for (const [candidateId, status] of Object.entries(input.candidate_statuses_by_id ?? {})) {
    const candidate = legacyContract.contract.candidates.find((item) => item.candidate_id === candidateId)
    if (!candidate) {
      throw new DecisionIntakeApiError('Unknown semantic candidate id.', 422)
    }
    if ((fieldCounts.get(candidate.field) ?? 0) !== 1) {
      throw new DecisionIntakeApiError(
        'This semantic confirmation requires Decision Intake v2 because the field has multiple candidate roles.',
        409
      )
    }
    legacyStatuses[candidate.field] = status
  }

  return normalizeContractResponse(
    await request(`/${encoded}/answers`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        candidate_statuses: legacyStatuses,
        information_availability: input.information_availability,
      }),
    })
  )
}

export async function getDecisionIntakeContract(sessionId: string): Promise<ContractResponse> {
  const encoded = encodeURIComponent(sessionId)
  return normalizeContractResponse(await requestV2WithFallback(`/v2/${encoded}/contract`, `/${encoded}/contract`))
}

export async function compileDecisionIntake(sessionId: string) {
  const encoded = encodeURIComponent(sessionId)
  return compiledResourceAllocationSchema.parse(
    await requestV2WithFallback(`/v2/${encoded}/compile`, `/${encoded}/compile`, { method: 'POST' })
  )
}
