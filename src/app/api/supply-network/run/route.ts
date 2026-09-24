import { NextResponse } from 'next/server'
import { DipApiError } from '@/shared/dip/server-client'
import {
  evaluateCandidateAreas,
  evaluateManualCandidate,
  makeWarehouseUnavailable,
  optimizeSupplyNetwork,
} from '@/features/supply-network-optimization/server'
import type { CandidateWarehouse, SupplyNetwork } from '@/features/supply-network-optimization/domain'

function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return
  const expected = new URL(request.url).origin
  if (origin !== expected) throw new DipApiError('Cross-origin request rejected.', 403)
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const body = (await request.json()) as {
      action?: string
      network?: SupplyNetwork
      warehouseId?: string
      candidate?: CandidateWarehouse
    }
    if (!body.network) return NextResponse.json({ error: 'Network input is required.' }, { status: 400 })

    if (body.action === 'optimize') {
      const payload = await optimizeSupplyNetwork(body.network)
      return NextResponse.json({ result: payload.result, decision_value: payload.decision_value })
    }
    if (body.action === 'unavailable' && body.warehouseId) {
      const payload = await makeWarehouseUnavailable(body.network, body.warehouseId)
      return NextResponse.json({ result: payload.result, decision_value: payload.decision_value })
    }
    if (body.action === 'candidates') {
      const payload = await evaluateCandidateAreas(body.network)
      return NextResponse.json({ result: payload.result, decision_value: payload.decision_value })
    }
    if (body.action === 'candidate' && body.candidate) {
      const payload = await evaluateManualCandidate(body.network, body.candidate)
      return NextResponse.json({ result: payload.result, decision_value: payload.decision_value })
    }
    return NextResponse.json({ error: 'Unsupported supply-network action.' }, { status: 400 })
  } catch (reason) {
    if (reason instanceof DipApiError) {
      return NextResponse.json({ error: reason.message }, { status: reason.status })
    }
    return NextResponse.json(
      { error: reason instanceof Error ? reason.message : 'Supply network request failed.' },
      { status: 500 }
    )
  }
}
