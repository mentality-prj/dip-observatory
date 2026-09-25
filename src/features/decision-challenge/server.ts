import 'server-only'

import { z } from 'zod'
import {
  actionValidationSchema,
  challengeDefinitionSchema,
  challengeRunSchema,
  type ChallengeAssignment,
} from './contracts'
import { dipRequest } from '@/shared/dip/server-client'

const base = '/api/v1/decision-challenge'

export function listDecisionChallenges() {
  return dipRequest(`${base}/definitions`, challengeDefinitionSchema.array())
}

export function startDecisionChallenge(challengeId: string, scenario?: Record<string, unknown>) {
  return dipRequest(`${base}/runs`, challengeRunSchema, {
    method: 'POST',
    signal: AbortSignal.timeout(25_000),
    body: JSON.stringify({ challenge_id: challengeId, ...(scenario ? { scenario } : {}) }),
  })
}

export function getDecisionChallenge(runId: string) {
  return dipRequest(`${base}/runs/${encodeURIComponent(runId)}`, challengeRunSchema)
}

export function validateDecisionChallengeAction(runId: string, snapshotId: string, humanAction: ChallengeAssignment) {
  return dipRequest(`${base}/runs/${encodeURIComponent(runId)}/validate`, actionValidationSchema, {
    method: 'POST',
    body: JSON.stringify({ snapshot_id: snapshotId, human_action: humanAction }),
  })
}

export function submitDecisionChallenge(
  runId: string,
  submissionId: string,
  snapshotId: string,
  humanAction: ChallengeAssignment
) {
  return dipRequest(`${base}/runs/${encodeURIComponent(runId)}/decision`, challengeRunSchema, {
    method: 'POST',
    signal: AbortSignal.timeout(25_000),
    body: JSON.stringify({ submission_id: submissionId, snapshot_id: snapshotId, human_action: humanAction }),
  })
}

export function recordDecisionChallengeCta(runId: string) {
  return dipRequest(`${base}/runs/${encodeURIComponent(runId)}/cta`, z.object({ status: z.string() }), {
    method: 'POST',
    body: '{}',
  })
}
