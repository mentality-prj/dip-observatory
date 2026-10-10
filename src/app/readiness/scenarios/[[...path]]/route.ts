import { NextResponse } from 'next/server'

/**
 * Removed as an operational RR solver endpoint.
 *
 * Asset/capability Monte Carlo scenarios are NOT a lossless translation of the
 * frozen Kernel's technician/job/slot contract. Never silently run a second
 * optimizer under the canonical Readiness Recovery product route.
 */
function retired() {
  return NextResponse.json(
    {
      code: 'RR_LEGACY_SOLVER_RETIRED',
      error: 'This simulation planner is not the QDIP Kernel. Use the authenticated Kernel-backed RR operator with a normalized RR execution request.',
    },
    { status: 410, headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function GET() { return retired() }
export async function POST() { return retired() }
