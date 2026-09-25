import { NextRequest, NextResponse } from 'next/server'

import {
  getDecisionChallenge,
  listDecisionChallenges,
  recordDecisionChallengeCta,
  startDecisionChallenge,
  submitDecisionChallenge,
  validateDecisionChallengeAction,
} from '@/features/decision-challenge/server'
import { DipApiError } from '@/shared/dip/server-client'

export const runtime = 'nodejs'
const MAX_BODY_BYTES = 1_100_000

const token = /^[a-zA-Z0-9_.:-]+$/

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  return !origin || origin === request.nextUrl.origin
}

async function handler(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await context.params
  if (!path.every((part) => token.test(part))) {
    return NextResponse.json({ error: 'Unsupported challenge resource' }, { status: 404 })
  }
  if (request.method !== 'GET' && !sameOrigin(request)) {
    return NextResponse.json({ error: 'A same-origin request is required' }, { status: 403 })
  }

  try {
    const contentLength = Number(request.headers.get('content-length') ?? '0')
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'payload_too_large' }, { status: 413 })
    }
    if (request.method === 'GET' && path.length === 0) {
      return NextResponse.json(await listDecisionChallenges(), {
        headers: { 'Cache-Control': 'no-store' },
      })
    }
    if (request.method === 'POST' && path.length === 1 && path[0] === 'runs') {
      const raw = await request.text()
      if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
        return NextResponse.json({ error: 'payload_too_large' }, { status: 413 })
      }
      const body = JSON.parse(raw) as { challenge_id?: string; scenario?: Record<string, unknown> }
      if (!body.challenge_id) {
        return NextResponse.json({ error: 'challenge_id is required' }, { status: 422 })
      }
      return NextResponse.json(await startDecisionChallenge(body.challenge_id, body.scenario))
    }
    if (path[0] === 'runs' && path.length >= 2) {
      const runId = path[1]
      if (request.method === 'GET' && path.length === 2) {
        return NextResponse.json(await getDecisionChallenge(runId), {
          headers: { 'Cache-Control': 'no-store' },
        })
      }
      const body = request.method === 'POST' ? await request.json() : {}
      if (request.method === 'POST' && path[2] === 'validate' && path.length === 3) {
        return NextResponse.json(
          await validateDecisionChallengeAction(runId, body.snapshot_id, body.human_action)
        )
      }
      if (request.method === 'POST' && path[2] === 'decision' && path.length === 3) {
        return NextResponse.json(
          await submitDecisionChallenge(
            runId,
            body.submission_id,
            body.snapshot_id,
            body.human_action
          )
        )
      }
      if (request.method === 'POST' && path[2] === 'cta' && path.length === 3) {
        return NextResponse.json(await recordDecisionChallengeCta(runId))
      }
    }
    return NextResponse.json({ error: 'Unsupported challenge resource' }, { status: 404 })
  } catch (error) {
    if (error instanceof DipApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json(
      { error: 'QDIP challenge is unavailable. Please retry.' },
      { status: 502 }
    )
  }
}

export { handler as GET, handler as POST }
