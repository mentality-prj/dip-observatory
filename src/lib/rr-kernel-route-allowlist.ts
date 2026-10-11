/** Strict, deny-by-default RR proxy surface. Never proxy arbitrary plugin paths. */
const identifier = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/

export function allowedKernelPath(path: string[], method: string) {
  if (path.some((part) => !identifier.test(part))) return false
  if (path.length === 1 && path[0] === 'preflight') return method === 'POST'
  if (path.length === 1 && path[0] === 'executions') return method === 'POST'
  if (path[0] === 'executions' && path.length === 2) return method === 'GET'
  if (path[0] === 'executions' && path.length === 3) {
    return (
      (path[2] === 'replan' && method === 'POST') ||
      (['replay-verification', 'presentation'].includes(path[2]) && method === 'GET')
    )
  }
  if (path[0] === 'decisions' && path.length === 3) {
    return method === 'GET' && ['history', 'history-integrity'].includes(path[2])
  }
  if (path[0] === 'decisions' && path.length === 4) {
    return method === 'GET' && path[2] === 'history' && path[3] === 'verified-export-page'
  }
  return false
}
