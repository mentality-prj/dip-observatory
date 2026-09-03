"use client";

import { useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, PlugZap } from "lucide-react";

import { testGasForecastProviderAction } from "@/app/admin/plugins/gas-forecast/providers/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  GAS_FORECAST_PROVIDER_CARDS,
  mapGasForecastFailure,
  type GasForecastConnectionResult,
  type GasForecastProviderCard,
  type GasForecastProviderId,
} from "@/lib/gas-forecast-provider-model";

const statusLabel = {
  not_configured: "NOT CONFIGURED",
  not_tested: "NOT TESTED",
  testing: "TESTING",
  connected: "CONNECTED",
  failed: "FAILED",
} as const;

const statusVariant = {
  not_configured: "neutral",
  not_tested: "amber",
  testing: "amber",
  connected: "emerald",
  failed: "rose",
} as const;

function getCardStatus(
  provider: GasForecastProviderCard,
  result: GasForecastConnectionResult | undefined,
  pendingProviderId: GasForecastProviderId | null,
) {
  if (pendingProviderId === provider.id) {
    return "testing" as const;
  }

  return result?.status ?? provider.initialStatus;
}

function ResultBlock({ result }: { result: GasForecastConnectionResult }) {
  return (
    <div className="space-y-4 rounded-[20px] border border-white/8 bg-black/20 p-4">
      <div className="space-y-1 text-sm text-slate-200">
        <p>
          <span className="text-slate-500">Connection:</span> {result.connection}
        </p>
        <p>
          <span className="text-slate-500">HTTP:</span> {result.httpStatus ?? "—"}
        </p>
        <p>
          <span className="text-slate-500">Failure type:</span>{" "}
          {result.kind ?? "—"}
        </p>
        <p>
          <span className="text-slate-500">Provider:</span> {result.provider}
        </p>
        <p>
          <span className="text-slate-500">Response time:</span>{" "}
          {result.responseTimeMs !== null ? `${result.responseTimeMs} ms` : "—"}
        </p>
      </div>

      {result.dataset ? (
        <div className="space-y-2 text-sm text-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
            Dataset
          </p>
          <p>
            <span className="text-slate-500">records:</span>{" "}
            {result.dataset.records ?? "—"}
          </p>
          <p>
            <span className="text-slate-500">first date:</span>{" "}
            {result.dataset.firstDate ?? "—"}
          </p>
          <p>
            <span className="text-slate-500">last date:</span>{" "}
            {result.dataset.lastDate ?? "—"}
          </p>
          <p>
            <span className="text-slate-500">country/facility:</span>{" "}
            {result.dataset.countryOrFacility ?? "—"}
          </p>
        </div>
      ) : null}

      {result.message ? (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-300/8 p-3 text-sm text-rose-100">
          {result.message}
        </div>
      ) : null}

      {result.sample.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
            Sample
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/8">
            <table className="min-w-full border-collapse text-left text-xs text-slate-200">
              <thead className="bg-white/6 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">date</th>
                  <th className="px-3 py-2 font-medium">gasInStorage</th>
                  <th className="px-3 py-2 font-medium">injection</th>
                  <th className="px-3 py-2 font-medium">withdrawal</th>
                  <th className="px-3 py-2 font-medium">workingGasVolume</th>
                </tr>
              </thead>
              <tbody>
                {result.sample.map((row, index) => (
                  <tr key={`${row.date ?? "row"}-${index}`} className="border-t border-white/8">
                    <td className="px-3 py-2">{row.date ?? "—"}</td>
                    <td className="px-3 py-2">{row.gasInStorage ?? "—"}</td>
                    <td className="px-3 py-2">{row.injection ?? "—"}</td>
                    <td className="px-3 py-2">{row.withdrawal ?? "—"}</td>
                    <td className="px-3 py-2">{row.workingGasVolume ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function GasForecastProvidersPage() {
  const [results, setResults] = useState<
    Partial<Record<GasForecastProviderId, GasForecastConnectionResult>>
  >({});
  const [pendingProviderId, setPendingProviderId] =
    useState<GasForecastProviderId | null>(null);

  async function handleTest(providerId: GasForecastProviderId) {
    setPendingProviderId(providerId);

    try {
      const result = await testGasForecastProviderAction({ providerId });
      setResults((current) => ({ ...current, [providerId]: result }));
    } catch (error) {
      setResults((current) => ({
        ...current,
        [providerId]: mapGasForecastFailure({
          providerId,
          httpStatus: null,
          responseTimeMs: null,
          payload: null,
          kind: "network",
          fallbackMessage:
            error instanceof Error ? error.message : "Unexpected provider error",
        }),
      }));
    } finally {
      setPendingProviderId((current) => (current === providerId ? null : current));
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 md:px-6 xl:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
              DIP Admin / Observatory
            </span>
            <Badge variant="amber" className="gap-1.5">
              <PlugZap className="h-3 w-3" aria-hidden="true" />
              Live provider path
            </Badge>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Gas Forecast Providers
            </h1>
            <p className="max-w-3xl text-sm text-slate-400">
              Test the real DIP → PluginRuntime → provider connectivity path. No
              browser-side provider credentials are used.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {GAS_FORECAST_PROVIDER_CARDS.map((provider) => {
            const result = results[provider.id];
            const currentStatus = getCardStatus(
              provider,
              result,
              pendingProviderId,
            );

            return (
              <Card key={provider.id} className="h-full">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{provider.title}</CardTitle>
                      <Badge
                        variant={statusVariant[currentStatus]}
                        className="w-fit"
                      >
                        {statusLabel[currentStatus]}
                      </Badge>
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl border p-3",
                        currentStatus === "connected"
                          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                          : currentStatus === "failed"
                            ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
                            : "border-white/8 bg-white/6 text-slate-300",
                      )}
                    >
                      {currentStatus === "connected" ? (
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                      ) : currentStatus === "failed" ? (
                        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Activity
                          className={cn(
                            "h-5 w-5",
                            currentStatus === "testing" ? "animate-pulse" : "",
                          )}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-slate-300">
                    {provider.api ? (
                      <p>
                        <span className="text-slate-500">API:</span> {provider.api}
                      </p>
                    ) : null}
                    {result?.httpStatus !== null && result?.httpStatus !== undefined ? (
                      <p>
                        <span className="text-slate-500">Last response:</span>{" "}
                        {result.httpStatus}
                      </p>
                    ) : null}
                    {result?.dataset?.records !== null &&
                    result?.dataset?.records !== undefined ? (
                      <p>
                        <span className="text-slate-500">Records:</span>{" "}
                        {result.dataset.records}
                      </p>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {result ? <ResultBlock result={result} /> : null}

                  <Button
                    type="button"
                    size="lg"
                    className="w-full"
                    disabled={Boolean(pendingProviderId)}
                    onClick={() => handleTest(provider.id)}
                  >
                    {pendingProviderId === provider.id
                      ? "Testing..."
                      : "Test connection"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
