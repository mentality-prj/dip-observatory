import { describe, expect, it } from 'vitest'
import { GTM_DATA_VERSION, gtmExactTemplate, importGtmExactPackage, validateGtmExactInput } from './data-workspace'

const input = {
  rows: [{ name: 'Example', domain: 'example.com', metadata: {} }],
  commercialContext: {
    offering: 'Decision intelligence for constrained allocation',
    problems_solved: ['Allocation under constraints'],
    target_industries: [],
    target_company_sizes: [],
    target_geographies: [],
    target_roles: [],
  },
}

describe('GTM exact data contract', () => {
  it('round-trips exact analyst input', () => {
    const imported = importGtmExactPackage(JSON.parse(JSON.stringify(gtmExactTemplate(input))))
    expect(imported.issues).toEqual([])
    expect(imported.input).toEqual(input)
    expect(GTM_DATA_VERSION).toBe('gtm-lab.v1')
  })

  it('rejects missing commercial context', () => {
    const issues = validateGtmExactInput({ rows: input.rows })
    expect(issues.some((issue) => issue.path.startsWith('input.commercialContext'))).toBe(true)
  })

  it('rejects incompatible package versions', () => {
    const imported = importGtmExactPackage({ ...gtmExactTemplate(input), schemaVersion: 'gtm-lab.v9' })
    expect(imported.input).toBeUndefined()
    expect(imported.issues[0]?.path).toBe('schemaVersion')
  })
})
