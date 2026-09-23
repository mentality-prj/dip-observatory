import 'server-only'

import { z } from 'zod'

import { normalizeDipBaseUrl } from '@/lib/dip-url'

export class DipApiError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = 'DipApiError'
    this.status = status
  }
}

function getDipBaseUrl() {
  const raw =
    process.env.DIP_API_BASE_URL ??
    process.env.DIP_URL ??
    process.env.NEXT_PUBLIC_DIP_API_BASE_URL ??
    ''
  return normalizeDipBaseUrl(raw)
}

function getDipApiKey() {
  return (process.env.DIP_API_KEY ?? process.env.DIP_ADMIN_API_KEY ?? '').trim()
}

function buildDipUrl(path: string) {
  return `${getDipBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
}

async function parseResponse<T>(response: Response, schema: z.ZodType<T>) {
  if (!response.ok) {
    let message = `DIP request failed with status ${response.status}`
    try {
      const payload = (await response.json()) as {
        detail?: string | { code?: string }
        error?: { message?: string }
      }
      message =
        typeof payload.detail === 'string'
          ? payload.detail
          : (payload.detail?.code ?? payload.error?.message ?? message)
    } catch {
      // Preserve the HTTP-derived fallback when the upstream payload is not JSON.
    }
    throw new DipApiError(message, response.status)
  }

  return schema.parse(await response.json())
}

export async function dipRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit
): Promise<T> {
  const apiKey = getDipApiKey()
  const baseUrl = getDipBaseUrl()

  if (!baseUrl || !apiKey) {
    throw new DipApiError(
      'DIP API is not configured. Set DIP_API_BASE_URL and DIP_API_KEY.',
      503
    )
  }

  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('x-api-key', apiKey)

  const response = await fetch(buildDipUrl(path), {
    ...init,
    headers,
    cache: 'no-store',
  })

  return parseResponse(response, schema)
}

export function getDipConnectionState() {
  const baseUrl = getDipBaseUrl()
  const apiKey = getDipApiKey()
  return {
    configured: Boolean(baseUrl && apiKey),
    baseUrl: baseUrl || null,
  }
}

export async function runDipPlugin(
  pluginName: string,
  capabilityId: string,
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const response = await dipRequest(
    `/api/v1/plugins/${pluginName}/execute`,
    z.object({ result: z.record(z.string(), z.unknown()) }),
    {
      method: 'POST',
      body: JSON.stringify({
        capability_id: capabilityId,
        input,
        config: {},
        metadata: { source: 'dip-observatory' },
        features: input,
      }),
    }
  )

  return response.result
}
