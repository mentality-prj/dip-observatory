import 'server-only'

import { z } from 'zod'
import { publicDipRequest } from '@/shared/dip/server-client'
import type { SupplyResilienceInput } from './domain'
import { toDipSupplyResilienceInput } from './mapper'

const responseSchema = z.object({ result: z.record(z.string(), z.unknown()) })

export async function evaluateSupplyResilience(input: SupplyResilienceInput) {
  return publicDipRequest('/api/v1/supply-resilience/public/evaluate', responseSchema, {
    method: 'POST',
    body: JSON.stringify(toDipSupplyResilienceInput(input)),
  })
}
