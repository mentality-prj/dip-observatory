import type { SupplyResilienceInput } from './domain'
import type { SupplyResilienceResponse } from './contracts'

export async function runSupplyResilience(input: SupplyResilienceInput): Promise<SupplyResilienceResponse['result']> {
  const response = await fetch('/api/supply-resilience/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const payload = (await response.json()) as SupplyResilienceResponse & { error?: string }
  if (!response.ok || !payload.result) throw new Error(payload.error ?? 'Supply resilience evaluation failed')
  return payload.result
}
