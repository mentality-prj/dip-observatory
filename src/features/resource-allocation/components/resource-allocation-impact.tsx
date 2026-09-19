"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

type Metrics = { priority_coverage: number; total_coverage: number; capacity_utilization: number; travel_cost: number; operating_cost?: number };
type Summary = { total_available: number; served: number; closing_unmet: number };
type Baseline = { metrics: Metrics; summary: Summary };
type Props = { metrics: Metrics; summary: Summary; baseline?: Baseline | null; moved: number; totalTeams: number; locale: "uk" | "en" | "pl" };

const labels = {
  uk: { kicker: "04 · CURRENT → RECOMMENDED", title: "Поточний розподіл проти рекомендації DIP", subtitle: "Поки поточний план не оцінений DIP у тому самому сценарії, показуємо лише розраховані показники рекомендації. Після оцінки поточного плану тут з’являться порівняння та Δ.", current: "Зараз", recommended: "Рекомендація", unavailable: "ще не оцінено", priority: "Покриття пріоритетних потреб", total: "Загальне покриття потреб", served: "Потреб буде покрито", unmet: "Залишиться без покриття", utilization: "Завантаження команд", travel: "Вартість переміщень", moved: "Команд змінять локацію", of: "з" },
  en: { kicker: "04 · CURRENT → RECOMMENDED", title: "Current allocation versus DIP recommendation", subtitle: "Until DIP evaluates the current plan under the same scenario, only calculated recommendation metrics are shown. Current values and measured Δ will appear after baseline evaluation.", current: "Current", recommended: "Recommended", unavailable: "not evaluated yet", priority: "Priority needs coverage", total: "Total needs coverage", served: "Needs served", unmet: "Needs left uncovered", utilization: "Team utilization", travel: "Movement cost", moved: "Teams changing location", of: "of" },
  pl: { kicker: "04 · CURRENT → RECOMMENDED", title: "Bieżąca alokacja a rekomendacja DIP", subtitle: "Dopóki DIP nie oceni bieżącego planu w tym samym scenariuszu, pokazujemy tylko obliczone metryki rekomendacji. Wartości bieżące i zmierzone Δ pojawią się po ocenie bazowej.", current: "Obecnie", recommended: "Rekomendacja", unavailable: "jeszcze nie oceniono", priority: "Pokrycie potrzeb priorytetowych", total: "Łączne pokrycie potrzeb", served: "Obsłużone potrzeby", unmet: "Potrzeby bez pokrycia", utilization: "Wykorzystanie zespołów", travel: "Koszt przemieszczeń", moved: "Zespoły zmieniające lokalizację", of: "z" },
} as const;

export function ResourceAllocationImpact({ metrics, summary, baseline, moved, totalTeams, locale }: Props) {
  const t = labels[locale];
  return <section className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-4 sm:p-6"><div className="text-xs font-bold uppercase tracking-wider text-rose-300">{t.kicker}</div><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div className="min-w-0"><h3 className="text-xl font-black sm:text-2xl">{t.title}</h3><p className="mt-2 max-w-4xl text-sm text-slate-500">{t.subtitle}</p></div><div className="text-right"><div className="text-xs text-slate-600">{t.moved}</div><div className="text-2xl font-black">{moved} <span className="text-sm font-medium text-slate-600">{t.of} {totalTeams}</span></div></div></div><div className="mt-6 grid gap-px bg-white/5 sm:grid-cols-2 xl:grid-cols-6"><Impact label={t.priority} current={baseline?.metrics.priority_coverage} recommended={metrics.priority_coverage} format="pct" unavailable={t.unavailable}/><Impact label={t.total} current={baseline?.metrics.total_coverage} recommended={metrics.total_coverage} format="pct" unavailable={t.unavailable}/><Impact label={t.served} current={baseline?.summary.served} recommended={summary.served} unavailable={t.unavailable}/><Impact label={t.unmet} current={baseline?.summary.closing_unmet} recommended={summary.closing_unmet} inverse unavailable={t.unavailable}/><Impact label={t.utilization} current={baseline?.metrics.capacity_utilization} recommended={metrics.capacity_utilization} format="pct" unavailable={t.unavailable}/><Impact label={t.travel} current={baseline?.metrics.travel_cost} recommended={metrics.travel_cost} inverse unavailable={t.unavailable}/></div></section>;
}

function Impact({ label, current, recommended, format, inverse = false, unavailable }: { label: string; current?: number; recommended: number; format?: "pct"; inverse?: boolean; unavailable: string }) {
  const render = (value: number) => format === "pct" ? `${Math.round(value * 100)}%` : value.toFixed(0);
  if (current === undefined) return <div className="bg-white/[0.04] p-4"><div className="text-xs leading-4 text-slate-500">{label}</div><div className="mt-4 text-2xl font-black">{render(recommended)}</div><div className="mt-2 text-xs text-slate-500">{unavailable}</div></div>;
  const delta = recommended - current;
  const favorable = Math.abs(delta) < 0.0001 ? null : inverse ? delta < 0 : delta > 0;
  const Icon = delta >= 0 ? ArrowUp : ArrowDown;
  const deltaText = `${delta > 0 ? "+" : ""}${format === "pct" ? `${Math.round(delta * 100)} pp` : delta.toFixed(0)}`;
  return <div className="bg-white/[0.04] p-4"><div className="text-xs leading-4 text-slate-500">{label}</div><div className="mt-4 flex items-end gap-2"><span className="text-sm text-slate-500">{render(current)}</span><span className="text-slate-600">→</span><b className="text-2xl">{render(recommended)}</b></div><div className={`mt-2 flex items-center gap-1 text-xs font-bold ${favorable === true ? "text-emerald-300" : favorable === false ? "text-rose-200" : "text-slate-500"}`}>{Math.abs(delta) < 0.0001 ? <span>0</span> : <><Icon className="h-3.5 w-3.5"/>{deltaText}</>}</div></div>;
}
