const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const RESOURCE_ALLOCATION_SERVICES = ["psychologist", "social-worker", "legal", "protection", "case-manager", "child-support"] as const;

export const RESOURCE_ALLOCATION_COMMUNITY_NAMES = Array.from(
  { length: 18 },
  (_, index) => `Громада ${String.fromCharCode(65 + index)}`,
);

const communities = RESOURCE_ALLOCATION_COMMUNITY_NAMES.map((id, index) => ({
  id,
  accessible: ![7, 14].includes(index),
  max_teams: index % 4 === 0 ? 2 : 3,
  demand: [0, 1, 2].map((offset) => ({
    service: RESOURCE_ALLOCATION_SERVICES[(index + offset) % RESOURCE_ALLOCATION_SERVICES.length],
    units: 9,
    priority: (offset === 0 && index % 3 === 0 ? "critical" : offset < 2 ? "high" : "normal") as "critical" | "high" | "normal",
  })),
  accessibility: index === 5 ? { Wed: false, Thu: false } : {},
  daily_demand: index % 5 === 0
    ? { Wed: [{ service: RESOURCE_ALLOCATION_SERVICES[index % RESOURCE_ALLOCATION_SERVICES.length], units: 3, priority: "high" as const }] }
    : {},
}));

export const RESOURCE_ALLOCATION_TEAMS = Array.from({ length: 10 }, (_, index) => ({
  id: `Команда ${index + 1}`,
  current_community: RESOURCE_ALLOCATION_COMMUNITY_NAMES[(index * 2) % RESOURCE_ALLOCATION_COMMUNITY_NAMES.length],
  skills: [
    RESOURCE_ALLOCATION_SERVICES[index % RESOURCE_ALLOCATION_SERVICES.length],
    RESOURCE_ALLOCATION_SERVICES[(index + 1) % RESOURCE_ALLOCATION_SERVICES.length],
  ],
  capacity: 12 + (index % 3) * 2,
  availability: index === 8 ? { Fri: false } : {},
  daily_capacity: index === 3 ? { Thu: 8 } : {},
  max_travel_cost: 18,
  cost_per_capacity: 0.4 + (index % 3) * 0.1,
  programs: [],
}));

const travelEdges = RESOURCE_ALLOCATION_COMMUNITY_NAMES.flatMap((from, index) =>
  [1, 2, 3].flatMap((step) => {
    const to = RESOURCE_ALLOCATION_COMMUNITY_NAMES[(index + step) % RESOURCE_ALLOCATION_COMMUNITY_NAMES.length];
    const back = RESOURCE_ALLOCATION_COMMUNITY_NAMES[(index - step + RESOURCE_ALLOCATION_COMMUNITY_NAMES.length) % RESOURCE_ALLOCATION_COMMUNITY_NAMES.length];
    return [
      { from, to, cost: step * 4, minutes: step * 18 },
      { from, to: back, cost: step * 4, minutes: step * 18 },
    ];
  }),
);

export const RESOURCE_ALLOCATION_CURRENT = Object.fromEntries(
  RESOURCE_ALLOCATION_TEAMS.map((team) => [team.id, team.current_community]),
);

export const RESOURCE_ALLOCATION_DEMO = {
  operation: "optimize" as const,
  planning_period: { days: DAYS },
  communities,
  teams: RESOURCE_ALLOCATION_TEAMS,
  travel_edges: travelEdges,
  current_allocation: RESOURCE_ALLOCATION_CURRENT,
  provenance: {
    source: "dip-observatory-synthetic-demo",
    mapping_version: "resource-allocation-demo/2",
  },
};
