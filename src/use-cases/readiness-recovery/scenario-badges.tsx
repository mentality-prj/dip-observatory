import type { ScenarioLabel } from './domain'

export function scenarioRoles(label: ScenarioLabel, labels?: ScenarioLabel[]) {
  return [...new Set(labels?.length ? labels : [label])]
}

export function ScenarioBadges({
  label,
  labels,
  translations,
}: {
  label: ScenarioLabel
  labels?: ScenarioLabel[]
  translations: Record<ScenarioLabel, string>
}) {
  const roles = scenarioRoles(label, labels)
  return (
    <div className="flex flex-wrap gap-1.5" data-testid="scenario-objective-badges">
      {roles.map((role, index) => (
        <span
          key={role}
          data-objective-role={role}
          className={
            index === 0
              ? 'border border-sky-300/30 bg-sky-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-sky-200'
              : 'border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[.08em] text-slate-400'
          }
        >
          {translations[role]}
        </span>
      ))}
    </div>
  )
}
