"use client";

import { Activity, BrainCircuit, Database, FlaskConical } from "lucide-react";
import { useState } from "react";

import { GasForecastEidosPage } from "@/components/admin/gas-forecast-eidos-page";
import { GasForecastProvidersPage } from "@/components/admin/gas-forecast-providers-page";
import { cn } from "@/lib/utils";

type GasForecastView = "data" | "engine";

const tabs: Array<{
  id: GasForecastView;
  label: string;
  description: string;
  icon: typeof Database;
}> = [
  {
    id: "data",
    label: "Data & providers",
    description: "Validate TTF, ENTSOG and weather inputs",
    icon: Database,
  },
  {
    id: "engine",
    label: "Forecast engine",
    description: "Run the gas.forecast.experiment capability",
    icon: BrainCircuit,
  },
];

export function GasForecastWorkspace() {
  const [view, setView] = useState<GasForecastView>("data");

  return (
    <main className="relative min-h-[calc(100vh-8rem)] overflow-hidden px-4 py-6 md:px-6 xl:px-10">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            Gas Forecast
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                European Gas Forecasting
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                A single public workspace for the gas forecasting data layer and decision engine.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-slate-400">
              <FlaskConical className="h-3.5 w-3.5 text-cyan-300" />
              DIP capability
            </div>
          </div>
        </header>

        <div className="grid gap-2 rounded-[24px] border border-white/10 bg-white/4 p-2 md:grid-cols-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={cn(
                  "flex items-start gap-3 rounded-[18px] px-4 py-3 text-left transition",
                  active
                    ? "border border-cyan-300/20 bg-cyan-300/10 text-white"
                    : "border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200",
                )}
              >
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-cyan-300" : "text-slate-500")} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{tab.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">{tab.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        <section className="min-w-0 overflow-hidden rounded-[28px] border border-white/10 bg-black/10 [&>main]:min-h-0 [&>main]:px-0 [&>main]:py-0 [&>main>div]:max-w-none [&>main>div]:gap-5 [&>main>div>header]:hidden">
          {view === "data" ? <GasForecastProvidersPage /> : <GasForecastEidosPage />}
        </section>
      </div>
    </main>
  );
}
