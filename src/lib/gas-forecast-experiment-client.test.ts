import assert from 'node:assert/strict'
import test from 'node:test'

import { getGasForecastExperimentCapabilityPath, runGasForecastExperiment } from '@/lib/gas-forecast-experiment-client'

const ORIGINAL_ENV = { ...process.env }
const ORIGINAL_FETCH = globalThis.fetch

test.afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  globalThis.fetch = ORIGINAL_FETCH
})

function request() {
  return {
    start_date: '2026-01-01',
    end_date: '2026-01-31',
    forecast_horizon_days: 7,
    volume_mwh: 10_000_000,
    procurement_threshold_eur_per_mwh: 85,
  }
}

test('uses the backend canonical gas forecast experiment route exactly once', async () => {
  process.env.DIP_API_BASE_URL = 'https://dip.example.com'
  process.env.DIP_API_KEY = 'test-key'
  delete process.env.DIP_GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH
  delete process.env.GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH

  const requestedUrls: string[] = []
  let requestBody = ''

  globalThis.fetch = (async (input, init) => {
    requestedUrls.push(String(input))
    requestBody = String(init?.body ?? '')
    return Response.json({ ok: true, records: 7 })
  }) as typeof fetch

  const result = await runGasForecastExperiment(request())

  assert.equal(result.status, 'succeeded')
  assert.deepEqual(requestedUrls, [
    'https://dip.example.com/api/v1/plugins/gas-forecast/capabilities/gas.forecast.experiment',
  ])
  assert.deepEqual(JSON.parse(requestBody), request())
})

test('preserves the real 404 response instead of replacing it with a synthetic endpoint error', async () => {
  process.env.DIP_API_BASE_URL = 'https://dip.example.com'
  process.env.DIP_API_KEY = 'test-key'
  delete process.env.DIP_GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH
  delete process.env.GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH

  let calls = 0
  globalThis.fetch = (async () => {
    calls += 1
    return Response.json({ detail: 'Capability not found' }, { status: 404 })
  }) as typeof fetch

  const result = await runGasForecastExperiment(request())

  assert.equal(calls, 1)
  assert.equal(result.status, 'failed')
  assert.equal(result.httpStatus, 404)
  assert.equal(result.message, 'Capability not found')
  assert.deepEqual(result.payload, { detail: 'Capability not found' })
})

test('returns network failure without probing unrelated routes', async () => {
  process.env.DIP_API_BASE_URL = 'https://dip.example.com'
  process.env.DIP_API_KEY = 'test-key'

  let calls = 0
  globalThis.fetch = (async () => {
    calls += 1
    throw new TypeError('fetch failed')
  }) as typeof fetch

  const result = await runGasForecastExperiment(request())

  assert.equal(calls, 1)
  assert.equal(result.status, 'failed')
  assert.equal(result.httpStatus, null)
  assert.equal(result.message, 'fetch failed')
})

test('allows an explicit capability path override', async () => {
  process.env.DIP_API_BASE_URL = 'https://dip.example.com'
  process.env.DIP_API_KEY = 'test-key'
  process.env.DIP_GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH = '/custom/gas-experiment'

  let requestedUrl = ''
  globalThis.fetch = (async (input) => {
    requestedUrl = String(input)
    return Response.json({ ok: true })
  }) as typeof fetch

  await runGasForecastExperiment(request())
  assert.equal(requestedUrl, 'https://dip.example.com/custom/gas-experiment')
})

test('returns a clear configuration failure when DIP credentials are missing', async () => {
  delete process.env.DIP_API_BASE_URL
  delete process.env.DIP_URL
  delete process.env.NEXT_PUBLIC_DIP_API_BASE_URL
  delete process.env.DIP_API_KEY
  delete process.env.DIP_ADMIN_API_KEY
  delete process.env.DIP_GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH
  delete process.env.GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH

  const result = await runGasForecastExperiment(request())

  assert.equal(result.status, 'failed')
  assert.equal(result.httpStatus, 503)
  assert.match(result.message ?? '', /DIP gas forecast experiment is not configured/)
  assert.equal(
    getGasForecastExperimentCapabilityPath(),
    '/api/v1/plugins/gas-forecast/capabilities/gas.forecast.experiment'
  )
})
