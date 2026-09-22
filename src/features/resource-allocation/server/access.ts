export class ResourceAllocationAccessError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'ResourceAllocationAccessError'
  }
}

export function assertSameOriginMutation(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin)
    throw new ResourceAllocationAccessError('A same-origin request is required.', 403)

  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite))
    throw new ResourceAllocationAccessError('A same-origin request is required.', 403)
}
