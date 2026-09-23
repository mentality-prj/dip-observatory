import 'server-only'

import {
  importTemplateSchema,
  importValidationSchema,
  pipelineRunSchema,
  type CommercialContext,
  type ProspectSeed,
} from './import-contracts'
import { gtmDemoSchema } from './contracts'
import {
  DipApiError,
  dipRequest,
  runDipPlugin,
} from '@/shared/dip/server-client'

export { DipApiError }

export async function runGtmDemo() {
  const result = await runDipPlugin('gtm-lab', 'gtm.demo.run', {})
  return gtmDemoSchema.parse(result)
}

export function getGtmImportTemplate() {
  return dipRequest('/api/v1/gtm-lab/imports/template', importTemplateSchema)
}

export function validateGtmImport(rows: Record<string, unknown>[]) {
  return dipRequest('/api/v1/gtm-lab/imports/validate', importValidationSchema, {
    method: 'POST',
    body: JSON.stringify({ rows }),
  })
}

export function runGtmPublicEvaluation(rows: ProspectSeed[], commercialContext: CommercialContext) {
  return dipRequest('/api/v1/gtm-lab/public/evaluate', pipelineRunSchema, {
    method: 'POST',
    body: JSON.stringify({ rows, commercial_context: commercialContext }),
  })
}
