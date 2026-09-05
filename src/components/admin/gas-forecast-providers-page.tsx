"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Home,
  PlugZap,
} from "lucide-react";
import Link from "next/link";

import {
  loadEntsogPointDirectoryAction,
  testGasForecastProviderAction,
} from "@/app/admin/plugins/gas-forecast/providers/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getEntsogDatePickerBounds,
  getTodayLocalDateIso,
  validateEntsogHistoricalDateRange,
} from "@/lib/entsog-date-range";
import {
  type EntsogPointPreset,
} from "@/lib/entsog-point-directory";
import { cn } from "@/lib/utils";
import {
  GAS_FORECAST_PROVIDER_CARDS,
  mapGasForecastFailure,
  type GasForecastConnectionResult,
  type GasForecastEntsogCheckInput,
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
          <p>
            <span className="text-rose-300/70">Error:</span> {result.message}
          </p>
          {result.errorDetail?.code ? (
            <p>
              <span className="text-rose-300/70">Code:</span>{" "}
              {result.errorDetail.code}
            </p>
          ) : null}
          {result.errorDetail?.upstreamStatus !== null &&
          result.errorDetail?.upstreamStatus !== undefined ? (
            <p>
              <span className="text-rose-300/70">Upstream status:</span>{" "}
              {result.errorDetail.upstreamStatus}
            </p>
          ) : null}
          {result.errorDetail?.executionId ? (
            <p>
              <span className="text-rose-300/70">Execution id:</span>{" "}
              {result.errorDetail.executionId}
            </p>
          ) : null}
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

function FlowPointCombobox({
  presets,
  selectedValue,
  onSelect,
  loading,
  error,
}: {
  presets: EntsogPointPreset[];
  selectedValue: string;
  onSelect: (value: string) => void;
  loading: boolean;
  error: string | null;
}) {
  const inputClassName =
    "h-10 rounded-xl px-3 text-sm md:h-11 md:rounded-2xl md:px-4";
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedPreset = presets.find((preset) => preset.value === selectedValue) ?? null;

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const options = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return presets;
    }
    return presets.filter((preset) =>
      preset.label.toLowerCase().includes(normalizedQuery),
    );
  }, [presets, query]);
  const activeOption = options[highlightedIndex] ?? null;
  const activeOptionId = activeOption
    ? `entsog-point-direction-option-${activeOption.value}`
    : open && options.length === 0
      ? "entsog-point-direction-option-empty"
      : undefined;
  const showListbox = open && !loading && !error;

  return (
    <div className="min-w-0 space-y-2" ref={containerRef}>
      <Label htmlFor="entsog-point-direction">Flow point</Label>
      <div className="relative min-w-0">
        <Input
          id="entsog-point-direction"
          type="text"
          className={cn(
            inputClassName,
            "min-w-0 max-w-full pr-12 whitespace-nowrap overflow-hidden text-ellipsis",
          )}
          role="combobox"
          aria-expanded={showListbox}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-activedescendant={showListbox ? activeOptionId : undefined}
          aria-controls={showListbox ? "entsog-point-direction-options" : undefined}
          autoComplete="off"
          value={query}
          onFocus={() => {
            setQuery(selectedPreset?.label ?? query);
            setHighlightedIndex(0);
            setOpen(true);
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            if (selectedPreset && nextValue !== selectedPreset.label) {
              onSelect("");
            }
            setHighlightedIndex(0);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
              setOpen(true);
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setHighlightedIndex((current) =>
                Math.min(current + 1, Math.max(options.length - 1, 0)),
              );
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setHighlightedIndex((current) => Math.max(current - 1, 0));
              return;
            }

            if (event.key === "Enter" && open) {
              event.preventDefault();
              const option = options[highlightedIndex];
              if (option) {
                onSelect(option.value);
                setQuery(option.label);
                setOpen(false);
              }
              return;
            }

            if (event.key === "Escape") {
              setQuery(selectedPreset?.label ?? "");
              setOpen(false);
            }
          }}
          placeholder="Search/select ENTSOG point..."
          disabled={loading || Boolean(error)}
        />
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>

      {loading ? <p className="text-xs text-slate-400">Loading ENTSOG flow points…</p> : null}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      {!loading && !error && presets.length === 0 ? (
        <p className="text-xs text-slate-400">No ENTSOG flow points available.</p>
      ) : null}

      {showListbox ? (
        <ul
          id="entsog-point-direction-options"
          role="listbox"
          className="max-h-56 w-full min-w-0 overflow-auto rounded-xl border border-white/12 bg-slate-950 p-1"
        >
          {options.length > 0
            ? options.map((option, index) => {
                const selected = option.value === selectedValue;
                const highlighted = highlightedIndex === index;
                return (
                  <li
                    key={option.value}
                    id={`entsog-point-direction-option-${option.value}`}
                    role="option"
                    aria-selected={selected}
                    data-active={highlighted ? "true" : "false"}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onSelect(option.value);
                      setQuery(option.label);
                      setHighlightedIndex(index);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex min-w-0 cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
                      highlighted ? "bg-white/10 text-white" : "text-slate-200 hover:bg-white/8",
                    )}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden="true"
                    />
                    <span className="block min-w-0 flex-1 truncate">{option.label}</span>
                  </li>
                );
              })
            : (
              <li
                id="entsog-point-direction-option-empty"
                role="option"
                aria-selected="false"
                aria-disabled="true"
                className="px-2 py-1.5 text-sm text-slate-400"
              >
                No matching flow points.
              </li>
            )}
        </ul>
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
  const [entsogConfig, setEntsogConfig] = useState({
    pointDirection: "",
    from: "",
    to: "",
  });
  const [entsogValidationError, setEntsogValidationError] = useState<string | null>(null);
  const [entsogDirectory, setEntsogDirectory] = useState<{
    presets: EntsogPointPreset[];
    loading: boolean;
    error: string | null;
  }>({
    presets: [],
    loading: true,
    error: null,
  });
  const [entsogToday, setEntsogToday] = useState(() => getTodayLocalDateIso());
  const entsogDateBounds = useMemo(
    () => getEntsogDatePickerBounds(entsogConfig.from, entsogToday),
    [entsogConfig.from, entsogToday],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nextToday = getTodayLocalDateIso();
      setEntsogToday((current) => (current === nextToday ? current : nextToday));
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let mounted = true;

    void loadEntsogPointDirectoryAction()
      .then((result) => {
        if (!mounted) {
          return;
        }

        setEntsogDirectory({
          presets: result.presets,
          loading: false,
          error: result.error,
        });
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setEntsogDirectory({
          presets: [],
          loading: false,
          error: "Failed to load ENTSOG flow points.",
        });
      });

    return () => {
      mounted = false;
    };
  }, []);

  function buildEntsogInput(): GasForecastEntsogCheckInput {
    return {
      pointDirection: entsogConfig.pointDirection.trim(),
      from: entsogConfig.from.trim(),
      to: entsogConfig.to.trim(),
      indicator: "Physical Flow",
      periodType: "day",
    };
  }

  function validateEntsogInput() {
    if (!entsogConfig.pointDirection.trim()) {
      return "Flow point is required.";
    }

    return validateEntsogHistoricalDateRange(
      {
        from: entsogConfig.from,
        to: entsogConfig.to,
      },
      entsogToday,
    );
  }

  async function handleTest(providerId: GasForecastProviderId) {
    if (providerId === "entsog") {
      const validationError = validateEntsogInput();
      setEntsogValidationError(validationError);
      if (validationError) {
        return;
      }
    }

    setPendingProviderId(providerId);

    try {
      const result = await testGasForecastProviderAction({
        providerId,
        entsog: providerId === "entsog" ? buildEntsogInput() : undefined,
      });
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
                DIP Admin / Observatory
              </span>
              <Badge variant="amber" className="gap-1.5">
                <PlugZap className="h-3 w-3" aria-hidden="true" />
                Live provider path
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

                  {provider.id === "entsog" ? (
                    <div className="space-y-3 rounded-[20px] border border-white/8 bg-black/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
                        ENTSOG query
                      </p>
                      <FlowPointCombobox
                        presets={entsogDirectory.presets}
                        loading={entsogDirectory.loading}
                        error={entsogDirectory.error}
                        selectedValue={entsogConfig.pointDirection}
                        onSelect={(value) => {
                          setEntsogValidationError(null);
                          setEntsogConfig((current) => ({
                            ...current,
                            pointDirection: value,
                          }));
                        }}
                      />
                      <div className="grid min-w-0 gap-3 md:grid-cols-2">
                        <div className="min-w-0 space-y-2">
                          <Label htmlFor="entsog-from">From</Label>
                          <Input
                            id="entsog-from"
                            type="date"
                            className="h-10 w-full min-w-0 max-w-full rounded-xl px-3 text-sm md:h-11 md:rounded-2xl md:px-4"
                            value={entsogConfig.from}
                            max={entsogDateBounds.fromMax}
                            onChange={(event) => {
                              setEntsogValidationError(null);
                              setEntsogConfig((current) => ({
                                ...current,
                                from: event.target.value,
                                to:
                                  current.to && event.target.value > current.to
                                    ? event.target.value
                                    : current.to,
                              }));
                            }}
                          />
                        </div>
                        <div className="min-w-0 space-y-2">
                          <Label htmlFor="entsog-to">To</Label>
                          <Input
                            id="entsog-to"
                            type="date"
                            className="h-10 w-full min-w-0 max-w-full rounded-xl px-3 text-sm md:h-11 md:rounded-2xl md:px-4"
                            value={entsogConfig.to}
                            max={entsogDateBounds.toMax}
                            min={entsogDateBounds.toMin}
                            onChange={(event) => {
                              setEntsogValidationError(null);
                              setEntsogConfig((current) => ({
                                ...current,
                                to: event.target.value,
                              }));
                            }}
                          />
                        </div>
                      </div>
                      {entsogValidationError ? (
                        <p className="text-xs text-rose-300">{entsogValidationError}</p>
                      ) : null}
                      <div className="grid gap-3 text-xs text-slate-400 md:grid-cols-2">
                        <p>
                          <span className="text-slate-500">Indicator:</span> Physical Flow
                        </p>
                        <p>
                          <span className="text-slate-500">Period type:</span> day
                        </p>
                      </div>
                    </div>
                  ) : null}

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
