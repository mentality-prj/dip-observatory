import type { Locale } from "@/lib/observatory-i18n";

type Metrics = { priority_coverage: number; total_coverage: number; unmet_need: number; capacity_utilization: number; travel_cost: number; operating_cost?: number };
type PeriodPlan = { aggregate_metrics: Metrics; period_score: number; demand_summary: { served: number; closing_unmet: number } };

type Props = { plans: PeriodPlan[]; selected: number; onSelect: (index: number) => void; locale: Locale };

const copy = {
  uk: { recommended: "Рекомендований план", alternative: "Альтернатива", priority: "Пріоритетне покриття", total: "Загальне покриття", served: "Покрито", unmet: "Без покриття", utilization: "Завантаження", travel: "Переміщення", operating: "Операційна вартість", score: "Оцінка плану" },
  en: { recommended: "Recommended plan", alternative: "Alternative", priority: "Priority coverage", total: "Total coverage", served: "Covered", unmet: "Uncovered", utilization: "Utilization", travel: "Movement cost", operating: "Operating cost", score: "Plan score" },
  pl: { recommended: "Rekomendowany plan", alternative: "Alternatywa", priority: "Pokrycie priorytetowe", total: "Łączne pokrycie", served: "Pokryto", unmet: "Bez pokrycia", utilization: "Wykorzystanie", travel: "Koszt przemieszczeń", operating: "Koszt operacyjny", score: "Ocena planu" },
} as const;

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const number = (value: number | undefined) => value == null ? "—" : Number.isInteger(value) ? String(value) : value.toFixed(1);

export function ResourceAllocationAlternatives({ plans, selected, onSelect, locale }: Props) {
  const t = copy[locale];
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{plans.map((plan, index) => {
    const m = plan.aggregate_metrics;
    return <button key={`${index}-${plan.period_score}`} onClick={() => onSelect(index)} className={`min-w-0 border p-4 text-left transition ${selected === index ? "border-[#d5222a] bg-red-50" : "border-black/10 bg-white hover:border-black/30"}`}>
      <div className="text-xs font-black uppercase tracking-wider text-black/50">{index === 0 ? t.recommended : `${t.alternative} ${index + 1}`}</div>
      <div className="mt-3 flex items-end justify-between gap-3"><div><div className="text-[11px] text-black/45">{t.priority}</div><div className="text-3xl font-black">{pct(m.priority_coverage)}</div></div><div className="text-right text-xs text-black/45">{t.score}<br/><b className="text-black">{number(plan.period_score)}</b></div></div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-black/10 pt-3 text-xs">
        <Metric label={t.total} value={pct(m.total_coverage)}/><Metric label={t.utilization} value={pct(m.capacity_utilization)}/>
        <Metric label={t.served} value={number(plan.demand_summary.served)}/><Metric label={t.unmet} value={number(plan.demand_summary.closing_unmet)}/>
        <Metric label={t.travel} value={number(m.travel_cost)}/><Metric label={t.operating} value={number(m.operating_cost)}/>
      </div>
    </button>;
  })}</div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><div className="break-words text-black/40">{label}</div><b className="mt-0.5 block text-sm">{value}</b></div>; }
