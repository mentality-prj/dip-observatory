import type {
  ResourceAllocationCommunityInput,
  ResourceAllocationDemandInput,
  ResourceAllocationInput,
  ResourceAllocationTeamInput,
} from './contracts'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const GENERIC_SERVICES = [
  'psychologist',
  'social-worker',
  'legal',
  'protection',
  'case-manager',
  'child-support',
] as const

const genericCommunityNames = Array.from(
  { length: 18 },
  (_, index) => `Громада ${String.fromCharCode(65 + index)}`
)

const genericCommunities = genericCommunityNames.map<ResourceAllocationCommunityInput>((id, index) => {
  const accessibility: Record<string, boolean> = index === 5 ? { Wed: false, Thu: false } : {}
  const dailyDemand: Record<string, ResourceAllocationDemandInput[]> =
    index % 5 === 0
      ? {
          Wed: [
            {
              service: GENERIC_SERVICES[index % GENERIC_SERVICES.length],
              units: 3,
              priority: 'high',
            },
          ],
        }
      : {}
  return {
    id,
    accessible: ![7, 14].includes(index),
    max_teams: index % 4 === 0 ? 2 : 3,
    demand: [0, 1, 2].map((offset) => ({
      service: GENERIC_SERVICES[(index + offset) % GENERIC_SERVICES.length],
      units: 9,
      priority: (offset === 0 && index % 3 === 0 ? 'critical' : offset < 2 ? 'high' : 'normal') as
        | 'critical'
        | 'high'
        | 'normal',
    })),
    accessibility,
    daily_demand: dailyDemand,
  }
})

const genericTeams = Array.from({ length: 10 }, (_, index): ResourceAllocationTeamInput => {
  const availability: Record<string, boolean> = index === 8 ? { Fri: false } : {}
  const dailyCapacity: Record<string, number> = index === 3 ? { Thu: 8 } : {}
  return {
    id: `Команда ${index + 1}`,
    current_community: genericCommunityNames[(index * 2) % genericCommunityNames.length],
    skills: [
      GENERIC_SERVICES[index % GENERIC_SERVICES.length],
      GENERIC_SERVICES[(index + 1) % GENERIC_SERVICES.length],
    ],
    capacity: 12 + (index % 3) * 2,
    availability,
    daily_capacity: dailyCapacity,
    max_travel_cost: 18,
    cost_per_capacity: 0.4 + (index % 3) * 0.1,
    programs: [],
  }
})

const genericTravelEdges = genericCommunityNames.flatMap((from, index) =>
  [1, 2, 3].flatMap((step) => {
    const to = genericCommunityNames[(index + step) % genericCommunityNames.length]
    const back =
      genericCommunityNames[
        (index - step + genericCommunityNames.length) % genericCommunityNames.length
      ]
    return [
      { from, to, cost: step * 4, minutes: step * 18 },
      { from, to: back, cost: step * 4, minutes: step * 18 },
    ]
  })
)

const genericCurrent = Object.fromEntries(
  genericTeams.map((team) => [team.id, team.current_community ?? null])
)

export const GENERIC_RESOURCE_ALLOCATION_PROFILE: ResourceAllocationInput = {
  operation: 'optimize',
  planning_period: { days: DAYS },
  communities: genericCommunities,
  teams: genericTeams,
  travel_edges: genericTravelEdges,
  current_allocation: genericCurrent,
  provenance: {
    source: 'dip-observatory-synthetic-demo',
    mapping_version: 'resource-allocation-demo/2',
  },
}

export const RESPONSIBLE_CITIZENS_PROFILE: ResourceAllocationInput = {
  operation: 'optimize',
  planning_period: { days: DAYS },
  communities: [
    {
      id: 'Краматорський напрямок',
      max_teams: 2,
      demand: [
        { service: 'psychosocial', units: 48, priority: 'critical' },
        { service: 'legal', units: 26, priority: 'high' },
      ],
      daily_demand: {
        Wed: [{ service: 'psychosocial', units: 13, priority: 'critical' }],
      },
    },
    {
      id: 'Покровський напрямок',
      max_teams: 2,
      demand: [
        { service: 'case-management', units: 40, priority: 'critical' },
        { service: 'legal', units: 31, priority: 'high' },
      ],
    },
    {
      id: 'Слов’янський напрямок',
      max_teams: 2,
      demand: [
        { service: 'psychosocial', units: 31, priority: 'high' },
        { service: 'child-support', units: 35, priority: 'high' },
      ],
    },
    {
      id: 'Дніпровський хаб',
      max_teams: 3,
      demand: [
        { service: 'case-management', units: 26, priority: 'normal' },
        { service: 'child-support', units: 22, priority: 'normal' },
      ],
    },
    {
      id: 'Запорізький хаб',
      max_teams: 2,
      demand: [
        { service: 'legal', units: 22, priority: 'high' },
        { service: 'psychosocial', units: 26, priority: 'high' },
      ],
      accessibility: { Thu: false },
    },
  ],
  teams: [
    {
      id: 'Мобільна команда 1',
      current_community: 'Дніпровський хаб',
      skills: ['psychosocial', 'case-management'],
      capacity: 18,
      max_travel_minutes: 180,
      cost_per_capacity: 0.6,
    },
    {
      id: 'Мобільна команда 2',
      current_community: 'Краматорський напрямок',
      skills: ['legal', 'case-management'],
      capacity: 16,
      max_travel_minutes: 150,
      cost_per_capacity: 0.55,
    },
    {
      id: 'Мобільна команда 3',
      current_community: 'Слов’янський напрямок',
      skills: ['psychosocial', 'child-support'],
      capacity: 17,
      max_travel_minutes: 150,
      cost_per_capacity: 0.5,
    },
    {
      id: 'Мобільна команда 4',
      current_community: 'Запорізький хаб',
      skills: ['legal', 'psychosocial'],
      capacity: 15,
      availability: { Fri: false },
      max_travel_minutes: 180,
      cost_per_capacity: 0.55,
    },
    {
      id: 'Мобільна команда 5',
      current_community: 'Дніпровський хаб',
      skills: ['case-management', 'child-support'],
      capacity: 16,
      daily_capacity: { Thu: 10 },
      max_travel_minutes: 180,
      cost_per_capacity: 0.5,
    },
  ],
  travel_edges: [
    { from: 'Дніпровський хаб', to: 'Краматорський напрямок', cost: 12, minutes: 155 },
    { from: 'Краматорський напрямок', to: 'Дніпровський хаб', cost: 12, minutes: 155 },
    { from: 'Дніпровський хаб', to: 'Покровський напрямок', cost: 13, minutes: 170 },
    { from: 'Покровський напрямок', to: 'Дніпровський хаб', cost: 13, minutes: 170 },
    { from: 'Дніпровський хаб', to: 'Слов’янський напрямок', cost: 12, minutes: 160 },
    { from: 'Слов’янський напрямок', to: 'Дніпровський хаб', cost: 12, minutes: 160 },
    { from: 'Дніпровський хаб', to: 'Запорізький хаб', cost: 7, minutes: 95 },
    { from: 'Запорізький хаб', to: 'Дніпровський хаб', cost: 7, minutes: 95 },
    { from: 'Краматорський напрямок', to: 'Покровський напрямок', cost: 6, minutes: 80 },
    { from: 'Покровський напрямок', to: 'Краматорський напрямок', cost: 6, minutes: 80 },
    { from: 'Краматорський напрямок', to: 'Слов’янський напрямок', cost: 3, minutes: 35 },
    { from: 'Слов’янський напрямок', to: 'Краматорський напрямок', cost: 3, minutes: 35 },
    { from: 'Покровський напрямок', to: 'Слов’янський напрямок', cost: 7, minutes: 90 },
    { from: 'Слов’янський напрямок', to: 'Покровський напрямок', cost: 7, minutes: 90 },
  ],
  current_allocation: {
    'Мобільна команда 1': 'Дніпровський хаб',
    'Мобільна команда 2': 'Краматорський напрямок',
    'Мобільна команда 3': 'Слов’янський напрямок',
    'Мобільна команда 4': 'Запорізький хаб',
    'Мобільна команда 5': 'Дніпровський хаб',
  },
  baseline_plan: {
    Mon: {
      'Мобільна команда 1': 'Дніпровський хаб',
      'Мобільна команда 2': 'Краматорський напрямок',
      'Мобільна команда 3': 'Слов’янський напрямок',
      'Мобільна команда 4': 'Запорізький хаб',
      'Мобільна команда 5': 'Дніпровський хаб',
    },
    Tue: {
      'Мобільна команда 1': 'Дніпровський хаб',
      'Мобільна команда 2': 'Покровський напрямок',
      'Мобільна команда 3': 'Слов’янський напрямок',
      'Мобільна команда 4': 'Запорізький хаб',
      'Мобільна команда 5': 'Дніпровський хаб',
    },
    Wed: {
      'Мобільна команда 1': 'Дніпровський хаб',
      'Мобільна команда 2': 'Покровський напрямок',
      'Мобільна команда 3': 'Слов’янський напрямок',
      'Мобільна команда 4': 'Запорізький хаб',
      'Мобільна команда 5': 'Дніпровський хаб',
    },
    Thu: {
      'Мобільна команда 1': 'Дніпровський хаб',
      'Мобільна команда 2': 'Покровський напрямок',
      'Мобільна команда 3': 'Слов’янський напрямок',
      'Мобільна команда 4': 'Дніпровський хаб',
      'Мобільна команда 5': 'Дніпровський хаб',
    },
    Fri: {
      'Мобільна команда 1': 'Дніпровський хаб',
      'Мобільна команда 2': 'Покровський напрямок',
      'Мобільна команда 3': 'Слов’янський напрямок',
      'Мобільна команда 4': 'Дніпровський хаб',
      'Мобільна команда 5': 'Дніпровський хаб',
    },
  },
  budget: 240,
  target_priority_coverage: 0.9,
  provenance: {
    source: 'responsible-citizens-canonical-v1',
    mapping_version: '2',
    case_id: 'responsible-citizens-canonical-v1',
    planning_unit: 'synthetic-service-demand-unit',
  },
}

export type ResourceAllocationProfileId = 'responsible-citizens' | 'generic'

export const RESOURCE_ALLOCATION_PROFILES: Record<
  ResourceAllocationProfileId,
  { label: string; input: ResourceAllocationInput }
> = {
  'responsible-citizens': {
    label: 'Responsible Citizens · synthetic',
    input: RESPONSIBLE_CITIZENS_PROFILE,
  },
  generic: {
    label: 'Generic humanitarian demo',
    input: GENERIC_RESOURCE_ALLOCATION_PROFILE,
  },
}

export function cloneResourceAllocationInput(input: ResourceAllocationInput): ResourceAllocationInput {
  return structuredClone(input)
}

export function resourceAllocationStats(input: ResourceAllocationInput) {
  const services = new Set<string>()
  let openingNeeds = 0
  let incomingNeeds = 0
  const days = input.planning_period?.days ?? []

  for (const community of input.communities) {
    for (const demand of community.demand) {
      services.add(demand.service)
      openingNeeds += demand.units
    }
    for (const day of days) {
      for (const demand of community.daily_demand?.[day] ?? []) {
        services.add(demand.service)
        incomingNeeds += demand.units
      }
    }
  }

  return {
    communities: input.communities.length,
    teams: input.teams.length,
    openingNeeds,
    incomingNeeds,
    horizonNeeds: openingNeeds + incomingNeeds,
    services: services.size,
    days: days.length || 1,
  }
}
