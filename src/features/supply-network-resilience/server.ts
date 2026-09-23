import 'server-only'

import { z } from 'zod'
import { dipRequest } from '@/shared/dip/server-client'
import type { SupplyResilienceInput } from './domain'
import { toDipSupplyResilienceInput } from './mapper'

const responseSchema = z.object({ result: z.record(z.string(), z.unknown()) })

export async function evaluateSupplyResilience(input: SupplyResilienceInput) {
  return dipRequest('/api/v1/supply-resilience/evaluate', responseSchema, {
    method: 'POST',
    body: JSON.stringify(toDipSupplyResilienceInput(input)),
  })
}
