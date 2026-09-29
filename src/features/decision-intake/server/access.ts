export class DecisionIntakeAccessError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'DecisionIntakeAccessError'
  }
}

export function assertDecisionIntakeSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin)
    throw new DecisionIntakeAccessError('A same-origin request is required.', 403)

  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite))
    throw new DecisionIntakeAccessError('A same-origin request is required.', 403)
}
