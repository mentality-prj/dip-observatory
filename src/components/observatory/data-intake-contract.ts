export const ANALYST_DATA_PACKAGE_VERSION = 'qdip.analyst-data.v1' as const

export type AnalystValidationIssue = { path: string; message: string }

export type AnalystDataSource = 'SYNTHETIC' | 'SMART_IMPORT' | 'EXACT_IMPORT'

export type AnalystDataEnvelope<TInput, TResult = unknown> = {
  schemaVersion: typeof ANALYST_DATA_PACKAGE_VERSION
  applicationId: string
  exportedAt: string
  source: AnalystDataSource
  input: TInput
  result?: TResult
}

export type ExactDataAdapter<TInput, TResult = unknown> = {
  applicationId: string
  dictionary: readonly (readonly [path: string, meaning: string, type: string, requirement: string])[]
  template: (input: TInput) => unknown
  importExact: (value: unknown) => { input?: TInput; issues: AnalystValidationIssue[] }
  exportAnalysis: (input: TInput, result?: TResult) => unknown
}

export type SmartIntakeProfile = {
  rows: number
  columns: number
  warnings: string[]
  raw: unknown
}

export async function analyzeWithSharedDecisionIntake(file: File): Promise<SmartIntakeProfile> {
  const form = new FormData()
  form.set('file', file)
  const response = await fetch('/api/decision-intake/analyze', { method: 'POST', body: form })
  const payload = (await response.json()) as {
    profile?: { row_count?: number; column_count?: number; warnings?: string[] }
    detail?: string
  }
  if (!response.ok || !payload.profile) throw new Error(payload.detail || 'Import failed.')
  return {
    rows: payload.profile.row_count ?? 0,
    columns: payload.profile.column_count ?? 0,
    warnings: payload.profile.warnings ?? [],
    raw: payload,
  }
}
