import type { Binding, Dimension, Plugin, Profile, ProfileView } from './contracts'

// Public, synthetic catalog. Guest requests never reach the private DIP API key.
const dimensions: Dimension[] = [
  {
    id: 'demo-benefit',
    name: 'Expected benefit (demo)',
    version: '1.0',
    type: 'numeric',
    source: 'configuration',
    evaluator_id: 'demo-only',
    evaluator_version: '1.0',
    blocking: false,
    required: false,
    configuration_schema: { type: 'object', properties: {} },
    value_schema: { type: 'number' },
  },
  {
    id: 'demo-cost',
    name: 'Cost (demo)',
    version: '1.0',
    type: 'numeric',
    source: 'configuration',
    evaluator_id: 'demo-only',
    evaluator_version: '1.0',
    blocking: false,
    required: false,
    configuration_schema: { type: 'object', properties: {} },
    value_schema: { type: 'number' },
  },
  {
    id: 'demo-risk',
    name: 'Risk (demo)',
    version: '1.0',
    type: 'numeric',
    source: 'configuration',
    evaluator_id: 'demo-only',
    evaluator_version: '1.0',
    blocking: false,
    required: false,
    configuration_schema: { type: 'object', properties: {} },
    value_schema: { type: 'number' },
  },
]
const plugins: Plugin[] = [
  {
    id: 'demo-manual',
    name: 'demo-manual',
    version: '1.0',
    enabled: true,
    description: 'Public, illustrative input model. No plugin or QDIP Core execution.',
    capabilities: ['manual-comparison'],
    capability_versions: { 'manual-comparison': '1.0' },
    dimension_outputs: [],
    dimension_bindings: [],
    ui: { label: 'Manual comparison (demo)', category: 'Demo' },
  },
]

let profiles = new Map<string, ProfileView>()
let bindings = new Map<string, Binding[]>()
let counter = 0
const MAX_PROFILES = 25

function clone<T>(item: T): T {
  return structuredClone(item)
}
function view(profile: Profile): ProfileView {
  return {
    ...clone(profile),
    validation: {
      status:
        profile.name.trim() && profile.alternatives.length >= 1 && profile.dimensions.length >= 1 ? 'VALID' : 'INVALID',
      errors: profile.dimensions.length ? [] : ['Add at least one demo dimension to continue.'],
      warnings: ['Illustrative local draft only; it is not validated or saved by QDIP Core.'],
    },
  }
}
function bodyProfile(init?: RequestInit): Profile {
  if (typeof init?.body !== 'string' || init.body.length > 250_000) throw Error('Demo draft exceeds limits.')
  const value: unknown = JSON.parse(init.body)
  if (!value || typeof value !== 'object' || !('alternatives' in value) || !Array.isArray(value.alternatives))
    throw Error('Invalid demo profile.')
  const profile = value as Profile
  if (typeof profile.name !== 'string' || profile.name.length > 200 || !Array.isArray(profile.dimensions))
    throw Error('Invalid demo profile.')
  return profile
}
function localDemoError(): never {
  throw new Error('Kernel execution and durable Decision Audit require an authorized Studio workspace.')
}

/** In-memory, tab-scoped demo workspace. Never uses cookies, localStorage or a server API. */
export async function demoStudioRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method?.toUpperCase() ?? 'GET'
  const parts = path.split('/')
  if (path === 'dimensions' && method === 'GET') return clone(dimensions) as T
  if (path === 'decision-studio/plugins' && method === 'GET') return clone(plugins) as T

  if (parts[0] === 'plugins' && parts.length === 3 && parts[2] === 'dimension-bindings') {
    if (method === 'GET') return clone(bindings.get(parts[1]) ?? []) as T
    if (method === 'PUT') {
      if (typeof init?.body !== 'string' || init.body.length > 250_000) throw Error('Invalid demo bindings.')
      const value: unknown = JSON.parse(init.body)
      if (!Array.isArray(value) || value.length > 100) throw Error('Invalid demo bindings.')
      bindings.set(parts[1], clone(value as Binding[]))
      return clone(value) as T
    }
  }
  if (parts[0] === 'decision-profiles') {
    if (parts.length === 1 && method === 'GET') return clone([...profiles.values()]) as T
    if (parts.length === 1 && method === 'POST') {
      if (profiles.size >= MAX_PROFILES) throw Error('Maximum number of temporary demo drafts reached.')
      const model = bodyProfile(init)
      const id = model.id && /^[a-zA-Z0-9_.-]{1,80}$/.test(model.id) ? model.id : 'demo-draft-' + ++counter
      if (profiles.has(id)) throw Error('A demo draft with this ID already exists.')
      const saved = view({ ...model, id })
      profiles.set(id, saved)
      return clone(saved) as T
    }
    if (parts.length >= 2) {
      const id = parts[1]
      if (parts.length === 3 && parts[2] === 'execute') return localDemoError()
      const stored = profiles.get(id)
      if (!stored) throw Error('Temporary demo draft not found. Reloading clears unsaved demo data.')
      if (parts.length === 2 && method === 'GET') return clone(stored) as T
      if (parts.length === 2 && method === 'PATCH') {
        const changed = bodyProfile(init)
        const saved = view({ ...changed, id })
        profiles.set(id, saved)
        return clone(saved) as T
      }
      if (parts.length === 2 && method === 'DELETE') {
        profiles.delete(id)
        return undefined as T
      }
    }
  }
  if (parts[0] === 'dimension-decisions') return localDemoError()
  throw new Error('This operation requires an authorized Studio workspace.')
}

/** Test only: reset volatile drafts between cases. */
export function resetDemoStudio() {
  profiles = new Map()
  bindings = new Map()
  counter = 0
}
