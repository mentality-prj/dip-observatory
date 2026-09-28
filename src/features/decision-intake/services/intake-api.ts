import 'server-only'

import { normalizeDipBaseUrl } from '@/lib/dip-url'

import { compiledResourceAllocationSchema, contractResponseSchema, intakeAnalysisSchema } from '../model/contracts'
import type { ContractResponse, IntakeAnalysis } from '../model/contracts'

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

export async function analyzeDecisionDataset(input: { file: File; businessContext?: string }): Promise<IntakeAnalysis> {
  const form = new FormData()
  form.set('file', input.file)
  if (input.businessContext?.trim()) {
    form.set('business_context', input.businessContext.trim())
  }
  return intakeAnalysisSchema.parse(await request('/analyze', { method: 'POST', body: form }))
}

export async function submitDecisionIntakeAnswers(
  sessionId: string,
  input: {
    candidate_statuses?: Record<string, string>
    information_availability?: Record<string, string>
    semantic_mappings?: Record<string, string>
  }
): Promise<ContractResponse> {
  return contractResponseSchema.parse(
    await request(`/${encodeURIComponent(sessionId)}/answers`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
  )
}

export async function getDecisionIntakeContract(sessionId: string): Promise<ContractResponse> {
  return contractResponseSchema.parse(await request(`/${encodeURIComponent(sessionId)}/contract`))
}

export async function compileDecisionIntake(sessionId: string) {
  return compiledResourceAllocationSchema.parse(
    await request(`/${encodeURIComponent(sessionId)}/compile`, { method: 'POST' })
  )
}
