import { commercialContextSchema, pipelineRunSchema, prospectSeedSchema, type CommercialContext, type PipelineRun, type ProspectSeed } from './import-contracts'

export const GTM_DATA_VERSION = 'gtm-lab.v1' as const

export type GtmExactInput = { rows: ProspectSeed[]; commercialContext: CommercialContext }
export type GtmDataPackage = {
  schemaVersion: typeof GTM_DATA_VERSION
  exportedAt: string
  input: GtmExactInput
  result?: PipelineRun
}
export type GtmDataIssue = { path: string; message: string }

export const GTM_DATA_DICTIONARY = [
  ['input.rows[].name', 'Prospect/company name', 'string', 'required'],
  ['input.rows[].domain', 'Company domain', 'string', 'optional'],
  ['input.rows[].industry', 'Industry used for portfolio segmentation', 'string', 'optional'],
  ['input.rows[].employee_count', 'Company size evidence', 'integer', 'optional'],
  ['input.rows[].revenue_eur', 'Revenue evidence', 'EUR', 'optional'],
  ['input.commercialContext.offering', 'Offering being evaluated', 'string', 'required'],
  ['input.commercialContext.problems_solved[]', 'Problems the offering solves', 'string[]', 'required'],
  ['input.commercialContext.target_industries[]', 'Target industries', 'string[]', 'optional'],
  ['input.commercialContext.target_geographies[]', 'Target geographies', 'string[]', 'optional'],
] as const

export function validateGtmExactInput(value: unknown): GtmDataIssue[] {
  if (!value || typeof value !== 'object') return [{ path: 'input', message: 'Expected an object.' }]
  const candidate = value as Partial<GtmExactInput>
  const issues: GtmDataIssue[] = []
  if (!Array.isArray(candidate.rows) || candidate.rows.length === 0) {
    issues.push({ path: 'input.rows', message: 'At least one prospect is required.' })
  } else {
    candidate.rows.forEach((row, index) => {
      const parsed = prospectSeedSchema.safeParse(row)
      if (!parsed.success)
        parsed.error.issues.forEach((issue) => issues.push({ path: `input.rows[${index}].${issue.path.join('.')}`, message: issue.message }))
    })
  }
  const context = commercialContextSchema.safeParse(candidate.commercialContext)
  if (!context.success)
    context.error.issues.forEach((issue) => issues.push({ path: `input.commercialContext.${issue.path.join('.')}`, message: issue.message }))
  return issues
}

export function gtmExactTemplate(input: GtmExactInput): GtmDataPackage {
  return { schemaVersion: GTM_DATA_VERSION, exportedAt: new Date(0).toISOString(), input }
}

export function gtmExportAnalysis(input: GtmExactInput, result?: PipelineRun): GtmDataPackage {
  return { schemaVersion: GTM_DATA_VERSION, exportedAt: new Date().toISOString(), input, result }
}

export function importGtmExactPackage(value: unknown): { input?: GtmExactInput; result?: PipelineRun; issues: GtmDataIssue[] } {
  if (!value || typeof value !== 'object') return { issues: [{ path: '$', message: 'Expected JSON object.' }] }
  const candidate = value as Partial<GtmDataPackage>
  if (candidate.schemaVersion !== GTM_DATA_VERSION)
    return { issues: [{ path: 'schemaVersion', message: `Expected ${GTM_DATA_VERSION}.` }] }
  const issues = validateGtmExactInput(candidate.input)
  if (issues.length) return { issues }
  const result = candidate.result ? pipelineRunSchema.safeParse(candidate.result) : null
  if (result && !result.success) return { issues: [{ path: 'result', message: 'Stored result does not match the current result contract.' }] }
  return { input: candidate.input as GtmExactInput, result: result?.data, issues: [] }
}

export function downloadGtmJson(fileName: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
