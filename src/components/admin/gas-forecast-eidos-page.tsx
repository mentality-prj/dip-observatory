"use client";

import { Check, Copy, FlaskConical, Home } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";

import { runGasForecastExperimentAction } from "@/app/admin/plugins/gas-forecast/eidos/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  GasForecastExperimentRequest,
  GasForecastExperimentResult,
} from "@/lib/gas-forecast-experiment-client";

const DEFAULT_FORM: GasForecastExperimentRequest = {
  start_date: "2025-01-01",
  end_date: "2026-09-09",
  forecast_horizon_days: 7,
  volume_mwh: 10_000_000,
  procurement_threshold_eur_per_mwh: 0,
};

export function GasForecastEidosPage({
  initialResult = null,
}: {
  initialResult?: GasForecastExperimentResult | null;
}) {
  const [isPending, startTransition] = useTransition();
  const isSubmittingRef = useRef(false);
  const [form, setForm] = useState<GasForecastExperimentRequest>(DEFAULT_FORM);
  const [result, setResult] = useState<GasForecastExperimentResult | null>(
    initialResult,
  );
  const [isPayloadCopied, setIsPayloadCopied] = useState(false);

  function update<K extends keyof GasForecastExperimentRequest>(
    key: K,
    value: GasForecastExperimentRequest[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function copyRawPayload() {
    if (!result) {
      return;
    }

    const rawPayload = JSON.stringify(result.payload, null, 2) ?? "";
    await navigator.clipboard.writeText(rawPayload);
    setIsPayloadCopied(true);
    window.setTimeout(() => setIsPayloadCopied(false), 1500);
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 md:px-6 xl:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
                DIP Admin / Observatory
              </span>
              <Badge variant="amber" className="gap-1.5">
                <FlaskConical className="h-3 w-3" aria-hidden="true" />
                EIDOS experiment
              </Badge>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-2 text-sm text-slate-300 outline-none transition hover:border-white/25 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              DIP Observatory
            </Link>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Gas Forecast — EIDOS Experiment
            </h1>
            <p className="max-w-3xl text-sm text-slate-400">
              Configure and execute the backend capability <code>gas.forecast.experiment</code>. No forecasting logic runs in the browser.
            </p>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Experiment request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (isSubmittingRef.current || isPending) {
                  return;
                }
                isSubmittingRef.current = true;
                startTransition(async () => {
                  try {
                    const response = await runGasForecastExperimentAction(form);
                    setResult(response);
                    setIsPayloadCopied(false);
                  } finally {
                    isSubmittingRef.current = false;
                  }
                });
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start-date">start_date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    className="h-11 min-h-11 max-h-11 appearance-none"
                    value={form.start_date}
                    onChange={(event) => update("start_date", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">end_date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    className="h-11 min-h-11 max-h-11 appearance-none"
                    value={form.end_date}
                    onChange={(event) => update("end_date", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forecast-horizon-days">forecast_horizon_days</Label>
                  <Input
                    id="forecast-horizon-days"
                    type="number"
                    min={1}
                    step={1}
                    value={String(form.forecast_horizon_days)}
                    onChange={(event) =>
                      update("forecast_horizon_days", Number(event.target.value || "0"))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volume-mwh">volume_mwh</Label>
                  <Input
                    id="volume-mwh"
                    type="number"
                    min={1}
                    step={1}
                    value={String(form.volume_mwh)}
                    onChange={(event) =>
                      update("volume_mwh", Number(event.target.value || "0"))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="procurement-threshold">
                    procurement_threshold_eur_per_mwh
                  </Label>
                  <Input
                    id="procurement-threshold"
                    type="number"
                    step={0.01}
                    value={String(form.procurement_threshold_eur_per_mwh)}
                    onChange={(event) =>
                      update(
                        "procurement_threshold_eur_per_mwh",
                        Number(event.target.value || "0"),
                      )
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? "Running experiment..." : "Run experiment"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result ? (
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Execution result</CardTitle>
                <Badge variant={result.status === "succeeded" ? "emerald" : "rose"}>
                  {result.status === "succeeded" ? "SUCCEEDED" : "FAILED"}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-slate-300">
                <p>
                  <span className="text-slate-500">HTTP:</span> {result.httpStatus ?? "—"}
                </p>
                <p>
                  <span className="text-slate-500">Response time:</span>{" "}
                  {result.responseTimeMs !== null ? `${result.responseTimeMs} ms` : "—"}
                </p>
                <p>
                  <span className="text-slate-500">Executed at:</span> {result.executedAt}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.message ? (
                <div className="rounded-2xl border border-rose-300/20 bg-rose-300/8 p-3 text-sm text-rose-100">
                  {result.message}
                </div>
              ) : null}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
                    Raw backend payload
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-white"
                    aria-label="Copy raw backend payload"
                    title="Copy raw backend payload"
                    onClick={copyRawPayload}
                  >
                    {isPayloadCopied ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
                <pre
                  aria-label="Raw backend payload"
                  className="overflow-x-auto rounded-2xl border border-white/8 bg-black/20 p-3 text-xs text-slate-200"
                >
                  {JSON.stringify(result.payload, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
