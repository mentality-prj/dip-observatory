'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Network, Play, Pause } from 'lucide-react'
import type { Locale } from '@/lib/observatory-i18n'
import { localizePlanningDay } from '../presentation'

type Team = { id: string; current_community: string }
type Props = {
  communities: string[]
  teams: Team[]
  day: string
  recommended: Record<string, string | null>
  opening?: Record<string, string | null>
  manual?: Record<string, string | null> | null
  manualOpening?: Record<string, string | null> | null
  locale: Locale
}
type Mode = 'current' | 'dip' | 'manager'
const WIDTH = 1120,
  HEIGHT = 500,
  CENTER_X = WIDTH / 2,
  CENTER_Y = HEIGHT / 2,
  RX = 455,
  RY = 190
const copy = {
  uk: {
    network: 'Операційна мережа',
    current: 'Стан на початок дня',
    dip: 'План QDIP',
    manager: 'План менеджера',
    description:
      'Порівняйте розташування команд на початок вибраного дня, рекомендацію QDIP та перевірене ручне коригування. Для вівторка–п’ятниці кожен план показує рух від власного призначення попереднього дня.',
    pause: 'Зупинити рух',
    animate: 'Показати рух',
    assigned: 'Призначено',
    moved: 'Переміщено',
    day: 'День',
    opening: 'ПОЧАТОК ДНЯ',
    dipPlan: 'ПЛАН DIP',
    managerPlan: 'ПЛАН МЕНЕДЖЕРА',
    moves: 'ПЕРЕМІЩЕНЬ',
    currentLegend: 'Де команди знаходяться на початок вибраного дня за планом QDIP.',
    dipLegend: 'Рекомендований QDIP розподіл для вибраного дня.',
    managerReady: 'Перевірене ручне коригування порівнюється з попереднім днем цього ж ручного плану.',
    managerWait: 'З’явиться після перевірки допустимого ручного плану.',
  },
  en: {
    network: 'Operational network',
    current: 'Start-of-day state',
    dip: 'QQDIP plan',
    manager: 'Manager plan',
    description:
      "Compare start-of-day team locations, the QDIP recommendation and an evaluated manager override. Tuesday–Friday movement for each plan starts from that plan's own previous-day assignment.",
    pause: 'Pause motion',
    animate: 'Animate moves',
    assigned: 'Assigned',
    moved: 'Moved',
    day: 'Day',
    opening: 'START OF DAY',
    dipPlan: 'QDIP PLAN',
    managerPlan: 'MANAGER PLAN',
    moves: 'TEAM MOVES',
    currentLegend: 'Team locations at the start of the selected day under the QQDIP plan.',
    dipLegend: 'Recommended DIP allocation for the selected day.',
    managerReady: 'The evaluated manager override is compared with the previous day of the same manual plan.',
    managerWait: 'Appears after a feasible manual override is evaluated.',
  },
  pl: {
    network: 'Sieć operacyjna',
    current: 'Stan na początek dnia',
    dip: 'Plan QDIP',
    manager: 'Plan menedżera',
    description:
      'Porównaj lokalizacje zespołów na początek dnia, rekomendację QDIP i zweryfikowaną korektę menedżera. Od wtorku do piątku ruch każdego planu zaczyna się od własnego przydziału z poprzedniego dnia.',
    pause: 'Zatrzymaj ruch',
    animate: 'Pokaż ruch',
    assigned: 'Przydzielono',
    moved: 'Przeniesiono',
    day: 'Dzień',
    opening: 'POCZĄTEK DNIA',
    dipPlan: 'PLAN DIP',
    managerPlan: 'PLAN MENEDŻERA',
    moves: 'PRZEMIESZCZEŃ',
    currentLegend: 'Lokalizacje zespołów na początku wybranego dnia według planu QDIP.',
    dipLegend: 'Rekomendowany przydział QDIP dla wybranego dnia.',
    managerReady: 'Zweryfikowana korekta menedżera jest porównywana z poprzednim dniem tego samego planu ręcznego.',
    managerWait: 'Pojawi się po ocenie dopuszczalnego planu ręcznego.',
  },
} as const

export function ResourceAllocationNetwork({
  communities,
  teams,
  day,
  recommended,
  opening,
  manual,
  manualOpening,
  locale,
}: Props) {
  const t = copy[locale]
  const [mode, setMode] = useState<Mode>('dip')
  const [animate, setAnimate] = useState(true)
  const points = useMemo(
    () =>
      Object.fromEntries(
        communities.map((community, index) => {
          const angle = (Math.PI * 2 * index) / communities.length - Math.PI / 2
          return [community, { x: CENTER_X + Math.cos(angle) * RX, y: CENTER_Y + Math.sin(angle) * RY }]
        })
      ),
    [communities]
  )
  const dipStart = useMemo(
    () => Object.fromEntries(teams.map((team) => [team.id, opening?.[team.id] ?? team.current_community])),
    [teams, opening]
  )
  const managerStart = useMemo(
    () =>
      Object.fromEntries(
        teams.map((team) => [team.id, manualOpening?.[team.id] ?? opening?.[team.id] ?? team.current_community])
      ),
    [teams, manualOpening, opening]
  )
  const start = mode === 'manager' && manual ? managerStart : dipStart
  const allocation = mode === 'current' ? dipStart : mode === 'manager' && manual ? manual : recommended
  const moved = teams.filter((team) => allocation[team.id] && allocation[team.id] !== start[team.id]).length
  const assigned = teams.filter((team) => allocation[team.id]).length
  const modeLabel = (item: Mode) => (item === 'current' ? t.current : item === 'manager' ? t.manager : t.dip)
  return (
    <section
      style={{ contain: 'inline-size' }}
      className="box-border w-full min-w-0 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-slate-950/80 text-white sm:max-w-full"
    >
      <div className="flex min-w-0 flex-col items-stretch gap-4 border-b border-white/10 p-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0 max-w-full">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-rose-300">
            <Network className="h-4 w-4 shrink-0" />
            {t.network}
          </div>
          <h3 className="mt-2 max-w-full break-words text-lg font-black [overflow-wrap:anywhere] sm:text-2xl">
            {t.current} <ArrowRight className="mx-1 inline h-4 w-4 sm:h-5 sm:w-5" /> QDIP{' '}
            <ArrowRight className="mx-1 inline h-4 w-4 sm:h-5 sm:w-5" /> {t.manager}
          </h3>
          <p className="mt-2 max-w-full break-words text-sm text-white/50 [overflow-wrap:anywhere] sm:max-w-3xl">
            {t.description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAnimate((value) => !value)}
          className="flex w-fit max-w-full items-center gap-2 border border-white/20 px-3 py-2 text-xs font-bold"
        >
          {animate ? <Pause className="h-3.5 w-3.5 shrink-0" /> : <Play className="h-3.5 w-3.5 shrink-0" />}
          {animate ? t.pause : t.animate}
        </button>
      </div>
      <div className="flex min-w-0 flex-col items-start gap-3 px-4 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 max-w-full flex-wrap gap-2">
          {(['current', 'dip', ...(manual ? ['manager'] : [])] as Mode[]).map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setMode(item)}
              className={`max-w-full whitespace-normal border px-3 py-2 text-left text-[10px] font-black uppercase tracking-normal sm:px-4 sm:text-xs sm:tracking-wider ${mode === item ? 'border-rose-400 bg-rose-400 text-white' : 'border-white/20 text-white/65'}`}
            >
              {modeLabel(item)}
            </button>
          ))}
        </div>
        <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
          <span>
            {t.assigned}{' '}
            <b className="text-white">
              {assigned}/{teams.length}
            </b>
          </span>
          <span>
            {t.moved} <b className="text-white">{moved}</b>
          </span>
          <span>
            {t.day} <b className="text-white">{localizePlanningDay(day, locale)}</b>
          </span>
        </div>
      </div>
      <div className="box-border w-full min-w-0 max-w-full overflow-hidden px-1 py-3 sm:px-0 sm:py-0">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-auto min-w-0 w-full max-w-full"
          role="img"
          aria-label={`${t.network}: ${localizePlanningDay(day, locale)}`}
        >
          <defs>
            <marker id="allocation-arrow-dip" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill="#fb7185" />
            </marker>
            <marker id="allocation-arrow-manager" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill="#fbbf24" />
            </marker>
          </defs>
          <g opacity="0.16">
            {communities.map((community, index) => {
              const next = communities[(index + 1) % communities.length]
              return (
                <line
                  key={`${community}-${next}`}
                  x1={points[community].x}
                  y1={points[community].y}
                  x2={points[next].x}
                  y2={points[next].y}
                  stroke="white"
                  strokeDasharray="3 8"
                />
              )
            })}
          </g>
          {mode !== 'current' &&
            teams.map((team, index) => {
              const sourceName = start[team.id]
              const from = sourceName ? points[sourceName] : null
              const targetName = allocation[team.id]
              const to = targetName ? points[targetName] : null
              if (!from || !to || targetName === sourceName) return null
              const curve = index % 2 === 0 ? -32 : 32
              const cx = (from.x + to.x) / 2,
                cy = (from.y + to.y) / 2 + curve
              return (
                <path
                  key={team.id}
                  d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
                  fill="none"
                  stroke={mode === 'manager' ? '#fbbf24' : '#fb7185'}
                  strokeWidth="2"
                  strokeOpacity="0.72"
                  markerEnd={mode === 'manager' ? 'url(#allocation-arrow-manager)' : 'url(#allocation-arrow-dip)'}
                  className={animate ? 'allocation-flow' : ''}
                />
              )
            })}
          {communities.map((community) => {
            const point = points[community]
            const here = teams.filter((team) => allocation[team.id] === community)
            const changed = here.some((team) => start[team.id] !== community)
            return (
              <g key={community} transform={`translate(${point.x},${point.y})`}>
                <circle
                  r={changed ? 25 : 21}
                  fill={changed ? (mode === 'manager' ? '#fbbf24' : '#fb7185') : '#242424'}
                  stroke="white"
                  strokeOpacity="0.25"
                />
                <text y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill={changed ? '#111' : 'white'}>
                  {community.replace('Громада ', '')}
                </text>
                {here.length > 0 && (
                  <>
                    <circle cx="17" cy="-17" r="10" fill="white" />
                    <text x="17" y="-13" textAnchor="middle" fontSize="10" fontWeight="900" fill="#111">
                      {here.length}
                    </text>
                  </>
                )}
                <text y="40" textAnchor="middle" fontSize="9" fill="white" opacity="0.48">
                  {community}
                </text>
              </g>
            )
          })}
          <g transform="translate(560,250)">
            <circle r="58" fill="#191919" stroke="white" strokeOpacity="0.15" />
            <text textAnchor="middle" y="-10" fontSize="11" fill="white" opacity="0.45">
              {mode === 'current' ? t.opening : mode === 'manager' ? t.managerPlan : t.dipPlan}
            </text>
            <text textAnchor="middle" y="15" fontSize="28" fontWeight="900" fill="white">
              {moved}
            </text>
            <text textAnchor="middle" y="32" fontSize="10" fill="white" opacity="0.45">
              {t.moves}
            </text>
          </g>
        </svg>
      </div>
      <div className="grid min-w-0 border-t border-white/10 md:grid-cols-3">
        <Legend title={t.current} text={t.currentLegend} />
        <Legend title="QDIP" text={t.dipLegend} />
        <Legend title={t.manager} text={manual ? t.managerReady : t.managerWait} />
      </div>
    </section>
  )
}
function Legend({ title, text }: { title: string; text: string }) {
  return (
    <div className="min-w-0 border-b border-white/10 p-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <b className="break-words text-sm">{title}</b>
      <p className="mt-1 break-words text-xs text-white/45">{text}</p>
    </div>
  )
}
