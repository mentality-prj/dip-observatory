import {
  actionValidationSchema,
  challengeDefinitionSchema,
  challengeRunSchema,
  type ChallengeAssignment,
} from './contracts'

async function request<T>(path: string, schema: { parse(value: unknown): T }, init?: RequestInit) {
  const response = await fetch(`/api/decision-challenge${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      typeof payload.error === 'string'
        ? payload.error
        : typeof payload.detail === 'string'
          ? payload.detail
          : payload.detail?.message ?? 'Decision Challenge request failed'
    throw new Error(message)
  }
  return schema.parse(payload)
}

export function loadChallenges() {
  return request('', challengeDefinitionSchema.array())
}

export function startChallenge(
  challengeId: string,
  scenario?: Record<string, unknown>
) {
  return request('/runs', challengeRunSchema, {
    method: 'POST',
    body: JSON.stringify({ challenge_id: challengeId, ...(scenario ? { scenario } : {}) }),
  })
}

export function validateChallengeAction(runId: string, snapshotId: string, humanAction: ChallengeAssignment) {
  return request(`/runs/${encodeURIComponent(runId)}/validate`, actionValidationSchema, {
    method: 'POST',
    body: JSON.stringify({ snapshot_id: snapshotId, human_action: humanAction }),
  })
}

export function submitChallengeAction(
  runId: string,
  submissionId: string,
  snapshotId: string,
  humanAction: ChallengeAssignment
) {
  return request(`/runs/${encodeURIComponent(runId)}/decision`, challengeRunSchema, {
    method: 'POST',
    body: JSON.stringify({
      submission_id: submissionId,
      snapshot_id: snapshotId,
      human_action: humanAction,
    }),
  })
}

export async function recordChallengeCta(runId: string) {
  const response = await fetch(`/api/decision-challenge/runs/${encodeURIComponent(runId)}/cta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!response.ok) throw new Error('CTA event could not be recorded')
}
