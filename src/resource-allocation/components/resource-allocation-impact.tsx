"use client";

import { Minus } from "lucide-react";

type Metrics = { priority_coverage: number; total_coverage: number; capacity_utilization: number; travel_cost: number; operating_cost?: number };
type Summary = { total_available: number; served: number; closing_unmet: number };
type Props = { metrics: Metrics; summary: Summary; moved: number; totalTeams: number; locale: "uk" | "en" | "pl" };

const labels = {
  uk: { kicker: "04 · ОЧІКУВАНИЙ РЕЗУЛЬТАТ", title: "Очікуваний результат рекомендованого плану", subtitle: "Це прогнозовані показники рекомендованого тижневого плану. Вони не позначають покращення відносно поточного розподілу, доки базовий план не оцінено окремо.", priority: "Пріоритетні потреби покрито", total: "Усі потреби покрито", served: "Потреб буде обслуговано", unmet: "Залишиться без покриття", utilization: "Завантаження команд", travel: "Вартість переміщень", moved: "Команд змінять локацію", of: "з" },
  en: { kicker: "04 · EXPECTED RESULT", title: "Expected result of the recommended plan", subtitle: "These are projected metrics for the recommended weekly plan. They do not claim improvement versus the current allocation until that baseline is evaluated separately.", priority: "Priority needs covered", total: "All needs covered", served: "Needs expected to be served", unmet: "Needs left uncovered", utilization: "Team utilization", travel: "Movement cost", moved: "Teams changing location", of: "of" },
  pl: { kicker: "04 · OCZEKIWANY WYNIK", title: "Oczekiwany wynik rekomendowanego planu", subtitle: "To prognozowane wskaźniki rekomendowanego planu tygodniowego. Nie oznaczają poprawy względem bieżącej alokacji, dopóki plan bazowy nie zostanie oceniony oddzielnie.", priority: "Pokryte potrzeby priorytetowe", total: "Pokryte wszystkie potrzeby", served: "Potrzeby obsłużone", unmet: "Potrzeby bez pokrycia", utilization: "Wykorzystanie zespołów", travel: "Koszt przemieszczeń", moved: "Zespoły zmieniające lokalizację", of: "z" },
} as const;

export function ResourceAllocationImpact({ metrics, summary, moved, totalTeams, locale }: Props) {
  const t = labels[locale];
  return <section className="bg-white p-6"><div className="text-xs font-bold uppercase tracking-wider text-[#d5222a]">{t.kicker}</div><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-2xl font-black">{t.title}</h3><p className="mt-2 max-w-4xl text-sm text-black/50">{t.subtitle}</p></div><div className="text-right"><div className="text-xs text-black/40">{t.moved}</div><div className="text-2xl font-black">{moved} <span className="text-sm font-medium text-black/40">{t.of} {totalTeams}</span></div></div></div><div className="mt-6 grid gap-px bg-black/10 sm:grid-cols-2 xl:grid-cols-6"><Impact label={t.priority} value={`${Math.round(metrics.priority_coverage * 100)}%`}/><Impact label={t.total} value={`${Math.round(metrics.total_coverage * 100)}%`}/><Impact label={t.served} value={`${summary.served.toFixed(0)} / ${summary.total_available.toFixed(0)}`}/><Impact label={t.unmet} value={summary.closing_unmet.toFixed(0)}/><Impact label={t.utilization} value={`${Math.round(metrics.capacity_utilization * 100)}%`}/><Impact label={t.travel} value={metrics.travel_cost.toFixed(1)}/></div></section>;
}

function Impact({ label, value }: { label: string; value: string }) { return <div className="bg-white p-4"><div className="flex items-start justify-between gap-2"><span className="text-xs leading-4 text-black/45">{label}</span><Minus className="h-4 w-4 shrink-0 text-black/25"/></div><div className="mt-4 text-2xl font-black">{value}</div></div>; }
