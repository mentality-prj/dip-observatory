/** Client-side race isolation; server-side authority is always the Kernel. */
export class OperatorRequestGuard {
  private revision = 0
  begin() {
    this.revision += 1
    return this.revision
  }
  invalidate() {
    this.revision += 1
  }
  current(revision: number) {
    return this.revision === revision
  }
}

export type OperatorErrorKind =
  'AUTH_REQUIRED' | 'ACCESS_DENIED' | 'CONFLICT' | 'INVALID_INPUT' | 'UNSUPPORTED' | 'UNAVAILABLE' | 'TRANSPORT_ERROR'

export function classifyOperatorHttpStatus(status: number): OperatorErrorKind {
  if (status === 401) return 'AUTH_REQUIRED'
  if (status === 403) return 'ACCESS_DENIED'
  if (status === 409 || status === 412) return 'CONFLICT'
  if (status === 400 || status === 413 || status === 415 || status === 422) return 'INVALID_INPUT'
  if (status === 404 || status === 410) return 'UNSUPPORTED'
  return 'UNAVAILABLE'
}

export class OperatorRequestError extends Error {
  constructor(
    readonly kind: OperatorErrorKind,
    message: string
  ) {
    super(message)
    this.name = 'OperatorRequestError'
  }
}

export function parsedExecutionIds(value: unknown): { executionId: string; decisionId: string } {
  if (!value || typeof value !== 'object') return { executionId: '', decisionId: '' }
  const result = 'result' in value ? value.result : undefined
  if (!result || typeof result !== 'object') return { executionId: '', decisionId: '' }
  const workflow = 'workflow' in result ? result.workflow : undefined
  if (!workflow || typeof workflow !== 'object') return { executionId: '', decisionId: '' }
  const executionId = 'execution_id' in workflow ? workflow.execution_id : null
  const ingestion = 'ingestion' in workflow ? workflow.ingestion : null
  const payload = ingestion && typeof ingestion === 'object' && 'payload' in ingestion ? ingestion.payload : null
  const decisionId = payload && typeof payload === 'object' && 'decision_id' in payload ? payload.decision_id : null
  const safe = (id: unknown) => (typeof id === 'string' && /^[a-zA-Z0-9][\w.-]{0,127}$/.test(id) ? id : '')
  return { executionId: safe(executionId), decisionId: safe(decisionId) }
}

