"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";
import { SCENARIOS, SCENARIO_ORDER } from "@/eidos/lib/eidos-decision";
import type { EidosScenario } from "@/eidos/types/eidos";

type Props = {
  scenario: EidosScenario;
  onChange: (scenario: EidosScenario) => void;
};

export function ScenarioSelector({ scenario, onChange }: Props) {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const moveTo = (index: number) => {
    const count = SCENARIO_ORDER.length;
    const nextIndex = ((index % count) + count) % count;
    onChange(SCENARIO_ORDER[nextIndex]);
    buttonsRef.current[nextIndex]?.focus();
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveTo(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveTo(index - 1);
        break;
      case "Home":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
        event.preventDefault();
        moveTo(SCENARIO_ORDER.length - 1);
        break;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        role="radiogroup"
        aria-label="Market scenario"
        className="flex flex-wrap gap-2"
      >
        {SCENARIO_ORDER.map((id, index) => {
          const params = SCENARIOS[id];
          const active = id === scenario;
          return (
            <button
              key={id}
              ref={(node) => {
                buttonsRef.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
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
