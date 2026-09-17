import { AlertTriangle, ArrowRight, ShieldAlert, Target } from "lucide-react";
import type { Locale } from "@/lib/observatory-i18n";

type Metrics = { priority_coverage: number; total_coverage: number; unmet_need: number; capacity_utilization: number; travel_cost: number; operating_cost?: number };
type DayPlan = { day: string; recommended: { assignments: Record<string, string | null>; metrics: Metrics }; demand: { opening: number; served: number; closing_unmet: number } };
type Plan = { daily: DayPlan[]; aggregate_metrics: Metrics; demand_summary: { total_available: number; served: number; closing_unmet: number } };
type Community = { id: string; accessible: boolean; demand: { units: number; priority: string }[] };

const copy = {
  uk: { eyebrow: "ОПЕРАЦІЙНЕ РІШЕННЯ", title: "Де виникає найбільший ризик непокритих потреб?", text: "DIP оцінює наслідки поточної ситуації та показує, як перерозподілити обмежені ресурси, щоб зменшити ризик для дітей і сімей.", risk: "ЗОНИ РИЗИКУ", consequence: "БЕЗ ВТРУЧАННЯ", decision: "РЕКОМЕНДАЦІЯ DIP", high: "високого пріоритету", inaccessible: "недоступні громади", uncovered: "потреб залишаться непокритими", coverage: "пріоритетне покриття", moved: "команд змінять локацію", cost: "вартість переміщень", drill: "Нижче — детальний план виконання та альтернативні стратегії." },
  en: { eyebrow: "OPERATIONAL DECISION", title: "Where is the greatest risk of unmet needs?", text: "DIP evaluates the consequences of the current situation and shows how to reallocate limited resources to reduce risk for children and families.", risk: "RISK AREAS", consequence: "WITHOUT INTERVENTION", decision: "DIP RECOMMENDATION", high: "high-priority needs", inaccessible: "inaccessible communities", uncovered: "needs remain uncovered", coverage: "priority coverage", moved: "teams change location", cost: "travel cost", drill: "Below is the execution plan and alternative strategies." },
  pl: { eyebrow: "DECYZJA OPERACYJNA", title: "Gdzie powstaje największe ryzyko niezaspokojonych potrzeb?", text: "DIP ocenia skutki bieżącej sytuacji i pokazuje, jak realokować ograniczone zasoby, aby zmniejszyć ryzyko dla dzieci i rodzin.", risk: "OBSZARY RYZYKA", consequence: "BEZ INTERWENCJI", decision: "REKOMENDACJA DIP", high: "potrzeb wysokiego priorytetu", inaccessible: "niedostępne społeczności", uncovered: "potrzeb pozostanie niezaspokojonych", coverage: "pokrycie priorytetów", moved: "zespołów zmieni lokalizację", cost: "koszt przejazdów", drill: "Poniżej znajduje się plan wykonania i strategie alternatywne." },
} as const;

export function ResourceAllocationDecisionOverview({ plan, communities, initialAllocation, locale }: { plan: Plan; communities: Community[]; initialAllocation: Record<string, string>; locale: Locale }) {
  const t = copy[locale];
  const priorityNeeds = communities.reduce((sum, community) => sum + community.demand.filter((d) => d.priority === "critical" || d.priority === "high").reduce((n, d) => n + d.units, 0), 0);
  const inaccessible = communities.filter((community) => !community.accessible).length;
  const firstDay = plan.daily[0];
  const moved = firstDay ? Object.entries(firstDay.recommended.assignments).filter(([team, target]) => target && initialAllocation[team] !== target).length : 0;
  const riskCommunities = [...communities].sort((a, b) => b.demand.reduce((n, d) => n + d.units * (d.priority === "critical" ? 3 : d.priority === "high" ? 2 : 1), 0) - a.demand.reduce((n, d) => n + d.units * (d.priority === "critical" ? 3 : d.priority === "high" ? 2 : 1), 0)).slice(0, 4);
  return <section className="min-w-0 overflow-hidden bg-white p-5 sm:p-7">
    <div className="max-w-4xl"><div className="text-xs font-bold uppercase tracking-[.18em] text-[#d5222a]">03 · {t.eyebrow}</div><h2 className="mt-2 text-2xl font-black sm:text-3xl">{t.title}</h2><p className="mt-3 text-sm leading-6 text-black/55 sm:text-base">{t.text}</p></div>
    <div className="mt-7 grid min-w-0 gap-4 lg:grid-cols-3">
      <div className="min-w-0 border border-black/10 p-5"><div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#d5222a]"><ShieldAlert className="h-4 w-4"/>{t.risk}</div><div className="mt-4 text-3xl font-black">{priorityNeeds}</div><div className="text-sm text-black/50">{t.high}</div><div className="mt-4 space-y-2 text-sm">{riskCommunities.map((c, i) => <div key={c.id} className="flex items-center justify-between gap-3"><span className="truncate">{c.id}</span><span className={i < 2 ? "font-bold text-[#d5222a]" : "text-black/45"}>{i < 2 ? "HIGH" : "MEDIUM"}</span></div>)}</div></div>
      <div className="min-w-0 border border-black/10 p-5"><div className="flex items-center gap-2 text-xs font-bold tracking-wider"><AlertTriangle className="h-4 w-4"/>{t.consequence}</div><div className="mt-4 text-3xl font-black">{plan.demand_summary.closing_unmet}</div><div className="text-sm text-black/50">{t.uncovered}</div><div className="mt-5 border-t border-black/10 pt-4 text-sm"><b>{inaccessible}</b> {t.inaccessible}</div></div>
      <div className="min-w-0 bg-[#191919] p-5 text-white"><div className="flex items-center gap-2 text-xs font-bold tracking-wider text-red-400"><Target className="h-4 w-4"/>{t.decision}</div><div className="mt-5 grid grid-cols-2 gap-4"><div><div className="text-2xl font-black">{(plan.aggregate_metrics.priority_coverage * 100).toFixed(1)}%</div><div className="text-xs text-white/50">{t.coverage}</div></div><div><div className="text-2xl font-black">{moved}</div><div className="text-xs text-white/50">{t.moved}</div></div><div><div className="text-2xl font-black">{plan.demand_summary.served}</div><div className="text-xs text-white/50">covered</div></div><div><div className="text-2xl font-black">{Math.round(plan.aggregate_metrics.travel_cost)}</div><div className="text-xs text-white/50">{t.cost}</div></div></div></div>
    </div>
    <div className="mt-5 flex items-center gap-2 text-sm font-medium text-black/55">{t.drill}<ArrowRight className="h-4 w-4 shrink-0"/></div>
  </section>;
}
