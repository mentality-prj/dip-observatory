"use client";

import { cn } from "@/lib/utils";
import { SCENARIOS, SCENARIO_ORDER } from "@/eidos/lib/eidos-decision";
import type { EidosScenario } from "@/eidos/types/eidos";

type Props = {
  scenario: EidosScenario;
  onChange: (scenario: EidosScenario) => void;
};

export function ScenarioSelector({ scenario, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div
        role="radiogroup"
        aria-label="Market scenario"
        className="flex flex-wrap gap-2"
      >
        {SCENARIO_ORDER.map((id) => {
          const params = SCENARIOS[id];
          const active = id === scenario;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.14em] outline-none transition",
                "focus-visible:ring-2 focus-visible:ring-cyan-300/60",
                active
                  ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-50"
                  : "border-white/12 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white",
              )}
            >
              {params.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-5 text-slate-400">
        {SCENARIOS[scenario].description}
      </p>
    </div>
  );
}
