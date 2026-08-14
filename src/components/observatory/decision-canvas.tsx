"use client";

import { useDeferredValue, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Gauge,
  Layers3,
  Orbit,
  Play,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StateSpaceChart } from "@/components/observatory/state-space-chart";
import { StateTimeline } from "@/components/observatory/state-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  observatoryRunResponseSchema,
  type DipScalar,
  type ObservatoryBootstrapPayload,
} from "@/lib/dip-contracts";
import {
  buildComparisonDeltas,
  buildMetricChips,
  buildStateSpaceTrajectories,
  buildTimelinePoints,
} from "@/lib/observatory-derive";
import { cn } from "@/lib/utils";
import { useObservatoryStore } from "@/stores/observatory-store";

type Props = {
  initialPayload: ObservatoryBootstrapPayload;
};

const badgeTone = {
  cyan: "cyan",
  emerald: "emerald",
  amber: "amber",
  rose: "rose",
} as const;

export function DecisionCanvas({ initialPayload }: Props) {
  const {
    bootstrap,
    scenarios,
    selectedScenarioId,
    scenario,
    alternatives,
    selectedAlternativeId,
    status,
    error,
    runResponse,
    hydrate,
    selectScenario,
    updateFeature,
    selectAlternative,
    setLoading,
    setSuccess,
    setError,
    resetAlternatives,
  } = useObservatoryStore();

  useEffect(() => {
    hydrate(initialPayload);
  }, [hydrate, initialPayload]);

  const activePayload = bootstrap ?? initialPayload;
  const trajectories = buildStateSpaceTrajectories({
    scenario,
    runResponse,
  });
  const deferredTrajectories = useDeferredValue(trajectories);
  const selectedTrajectory =
    deferredTrajectories.find(
      (trajectory) => trajectory.id === selectedAlternativeId,
    ) ??
    deferredTrajectories[0] ??
    null;
  const metrics = buildMetricChips(selectedTrajectory);
  const comparison = buildComparisonDeltas(deferredTrajectories);
  const timeline = buildTimelinePoints(selectedTrajectory);
  const axisLabels = scenario
    ? {
        x: scenario.stateAxes[0]?.label ?? "Pressure",
        y: scenario.stateAxes[1]?.label ?? "Readiness",
      }
    : null;
  const warnings = Array.from(
    new Set([...activePayload.warnings, ...(runResponse?.warnings ?? [])]),
  );

  async function handleRun() {
    if (
      !scenario ||
      !activePayload.connection.configured ||
      alternatives.length === 0
    ) {
      return;
    }

    setLoading();

    try {
      const response = await fetch("/api/observatory/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenarioId: scenario.id,
          alternatives,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(
          typeof payload?.error === "string"
            ? payload.error
            : "Unable to execute the live DIP scenario.",
        );
        return;
      }

      setSuccess(observatoryRunResponseSchema.parse(payload));
    } catch (runError) {
      setError(
        runError instanceof Error
          ? runError.message
          : "Unable to execute the live DIP scenario.",
      );
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 md:px-6 xl:px-10">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-6">
        <header className="grid gap-5 rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(11,17,31,0.96),rgba(7,10,18,0.98))] px-6 py-6 shadow-[0_24px_90px_rgba(0,0,0,0.32)] lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="cyan">DIP Observatory</Badge>
              <Badge
                variant={
                  activePayload.connection.configured ? "emerald" : "amber"
                }
              >
                Frontend Client Only
              </Badge>
              <Badge variant="neutral">Decision semantics stay in DIP</Badge>
            </div>
            <div>
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-[2.7rem]">
                Scenario-driven Observatory for the existing DIP API.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
                The UI remains a standalone Next.js client, while DIP now owns
                the scenario catalog, risk propagation, system stability,
                uncertainty, state vectors, and decision alternatives returned
                by the observatory contract.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <HeaderStat
              icon={Orbit}
              label="Connection"
              value={
                activePayload.connection.configured ? "Configured" : "Missing"
              }
              detail={
                activePayload.connection.baseUrl ??
                "Set DIP_API_BASE_URL and DIP_API_KEY"
              }
            />
            <HeaderStat
              icon={Layers3}
              label="Scenario Catalog"
              value={
                activePayload.connection.scenarioCatalogAvailable
                  ? `${scenarios.length} scenarios`
                  : "Unavailable"
              }
              detail={
                scenario
                  ? `${scenario.domain} · ${scenario.modelId}`
                  : "No scenario selected"
              }
            />
            <HeaderStat
              icon={Gauge}
              label="Run Surface"
              value={
                activePayload.connection.runSurfaceAvailable
                  ? "Ready"
                  : "Unavailable"
              }
              detail="Runs full Observatory analysis inside DIP, then returns it through the Next.js server-side proxy."
            />
            <HeaderStat
              icon={ArrowRightLeft}
              label="Comparison Mode"
              value={`${alternatives.length} alternatives`}
              detail="Scenario presets come from the DIP API and execute under the same analysis contract."
            />
          </div>
        </header>

        {warnings.length > 0 || error ? (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="rounded-[24px] border border-amber-300/18 bg-amber-300/8 px-5 py-4 text-sm text-amber-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-2">
                  {error ? (
                    <p className="font-medium text-amber-100">{error}</p>
                  ) : null}
                  {warnings.slice(0, 4).map((warning) => (
                    <p key={warning} className="leading-6 text-amber-50/88">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-start justify-end">
              <Button variant="secondary" onClick={resetAlternatives}>
                <RefreshCcw className="h-4 w-4" />
                Reset Inputs
              </Button>
            </div>
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_380px]">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Configuration / Input</CardTitle>
                  <CardDescription>
                    Choose one of the DIP-served scenarios, inspect its preset
                    alternatives, and run the live analysis contract.
                  </CardDescription>
                </div>
                <Sparkles className="h-5 w-5 text-cyan-200" />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3 rounded-[24px] border border-white/8 bg-white/4 p-4">
                <SectionTitle
                  title="Scenario Catalog"
                  subtitle="Five domain scenarios are served by DIP and selected here without changing the overall UI architecture."
                />
                <div className="grid gap-3">
                  {scenarios.map((item) => {
                    const active = item.id === selectedScenarioId;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectScenario(item.id)}
                        className={cn(
                          "rounded-[20px] border px-4 py-4 text-left transition",
                          active
                            ? "border-cyan-300/30 bg-cyan-300/10"
                            : "border-white/8 bg-slate-950/38 hover:border-white/14 hover:bg-white/6",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {item.name}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                              {item.domain}
                            </p>
                          </div>
                          <Badge variant={active ? "cyan" : "neutral"}>
                            {active ? "Selected" : "Load"}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-400">
                          {item.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Selected Scenario
                </p>
                <p className="mt-3 text-sm font-medium text-white">
                  {scenario?.name ?? "DIP not connected"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {scenario?.description ??
                    "Configure DIP credentials to bootstrap Observatory from the API."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="cyan">{scenario?.domain ?? "n/a"}</Badge>
                  <Badge variant="neutral">
                    Model {scenario?.modelId ?? "n/a"}
                  </Badge>
                  <Badge variant="neutral">
                    Dataset {scenario?.datasetId ?? "n/a"}
                  </Badge>
                </div>
              </div>

              {alternatives.map((alternative) => (
                <AlternativeCard
                  key={alternative.id}
                  alternative={alternative}
                  scenario={scenario}
                  description={
                    scenario?.presets.find(
                      (preset) => preset.id === alternative.id,
                    )?.description ?? null
                  }
                  selected={selectedAlternativeId === alternative.id}
                  onSelect={() => selectAlternative(alternative.id)}
                  onChange={(fieldName, value) =>
                    updateFeature(alternative.id, fieldName, value)
                  }
                />
              ))}

              <Button
                size="lg"
                className="w-full"
                onClick={handleRun}
                disabled={
                  !scenario ||
                  !activePayload.connection.configured ||
                  status === "loading"
                }
              >
                <Play className="h-4 w-4" />
                {status === "loading" ? "Running DIP..." : "Run Live Scenario"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>State-Space Projection</CardTitle>
                    <CardDescription>
                      A 2D projection of API-returned current state, predicted
                      state, uncertainty, and future trajectories for the
                      selected scenario branch.
                    </CardDescription>
                  </div>
                  <Activity className="h-5 w-5 text-cyan-200" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <StateSpaceChart
                  trajectories={deferredTrajectories}
                  selectedAlternativeId={selectedAlternativeId}
                  status={status}
                  hasRun={Boolean(runResponse)}
                  axisLabels={axisLabels}
                  onSelect={selectAlternative}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>State Timeline</CardTitle>
                <CardDescription>
                  Tracks the selected branch from the current state to the
                  optimistic and conservative futures returned by DIP.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StateTimeline points={timeline} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Decision Analysis</CardTitle>
                  <CardDescription>
                    All primary metrics in this panel come directly from the DIP
                    observatory contract. The client only formats and compares
                    them.
                  </CardDescription>
                </div>
                <Gauge className="h-5 w-5 text-cyan-200" />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {selectedTrajectory ? (
                <>
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Selected path
                        </p>
                        <p className="mt-2 text-base font-medium text-white">
                          {selectedTrajectory.label}
                        </p>
                      </div>
                      <Badge variant={badgeTone[metrics[0]?.tone ?? "cyan"]}>
                        {metrics[0]?.value ?? "N/A"}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {metrics.map((metric) => (
                        <div
                          key={metric.label}
                          className="rounded-[20px] border border-white/8 bg-slate-950/48 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                {metric.label}
                              </p>
                              <p className="mt-2 text-sm font-medium text-white">
                                {metric.value}
                              </p>
                            </div>
                            <Badge variant={badgeTone[metric.tone]}>
                              {metric.source === "api" ? "API" : "CMP"}
                            </Badge>
                          </div>
                          <p className="mt-3 text-xs leading-5 text-slate-400">
                            {metric.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <DataRow
                      label="Current State"
                      value={selectedTrajectory.metrics.currentState || "n/a"}
                    />
                    <DataRow
                      label="Predicted State"
                      value={selectedTrajectory.metrics.predictedState}
                    />
                    <DataRow
                      label="Matched Rule"
                      value={selectedTrajectory.metrics.matchedRule}
                    />
                    <DataRow
                      label="Execution"
                      value={`${selectedTrajectory.executionTimeMs} ms`}
                    />
                    <DataRow
                      label="Uncertainty Interval"
                      value={`${Math.round(selectedTrajectory.metrics.uncertainty * 100)}% envelope from DIP`}
                    />
                  </div>

                  <div className="space-y-3">
                    <SectionTitle
                      title="Alternative Comparison"
                      subtitle="Baseline vs challenger under the same live DIP scenario contract"
                    />
                    {comparison.length > 0 ? (
                      <div className="grid gap-3">
                        {comparison.map((item) => (
                          <div
                            key={item.label}
                            className="rounded-[20px] border border-white/8 bg-white/5 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-white">
                                {item.label}
                              </p>
                              <Badge variant={badgeTone[item.tone]}>
                                {item.value}
                              </Badge>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-400">
                              {item.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyNotice text="Run two alternatives to unlock comparison deltas." />
                    )}
                  </div>

                  <div className="space-y-3">
                    <SectionTitle
                      title="Decision Alternatives"
                      subtitle="Counterfactual decisions and outcome/risk trade-offs returned directly by DIP"
                    />
                    {selectedTrajectory.alternativeDecisions.length > 0 ? (
                      <div className="grid gap-3">
                        {selectedTrajectory.alternativeDecisions.map(
                          (decisionOption) => (
                            <div
                              key={`${selectedTrajectory.id}-${decisionOption.decision}`}
                              className="rounded-[20px] border border-white/8 bg-white/5 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-white">
                                    {decisionOption.decision}
                                  </p>
                                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                                    Rank {decisionOption.rank}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge
                                    variant={
                                      decisionOption.selected
                                        ? "cyan"
                                        : toneForRisk(decisionOption.risk)
                                    }
                                  >
                                    Risk {Math.round(decisionOption.risk * 100)}
                                    %
                                  </Badge>
                                  <Badge
                                    variant={toneForConfidence(
                                      decisionOption.confidence,
                                    )}
                                  >
                                    Conf{" "}
                                    {Math.round(
                                      decisionOption.confidence * 100,
                                    )}
                                    %
                                  </Badge>
                                </div>
                              </div>
                              <p className="mt-3 text-sm leading-6 text-slate-300">
                                {decisionOption.outcome}
                              </p>
                              <p className="mt-2 text-xs leading-5 text-slate-500">
                                {decisionOption.rationale}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <EmptyNotice text="No alternative decisions were returned for the selected branch." />
                    )}
                  </div>

                  <div className="space-y-3">
                    <SectionTitle
                      title="Why This Decision"
                      subtitle="Explanation bullets returned by the DIP observatory run contract"
                    />
                    {selectedTrajectory.explanationBullets.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedTrajectory.explanationBullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="rounded-[18px] border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300"
                          >
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyNotice text="No explanation was returned for the selected path." />
                    )}
                  </div>

                  <div className="space-y-3">
                    <SectionTitle
                      title="Rule Evidence"
                      subtitle="Condition-level traces surfaced directly by the DIP scenario workflow"
                    />
                    {selectedTrajectory.evidenceBullets.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedTrajectory.evidenceBullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="rounded-[18px] border border-white/8 bg-slate-950/48 px-4 py-3 text-sm text-slate-300"
                          >
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyNotice text="No rule evidence was returned for the selected branch." />
                    )}
                  </div>
                </>
              ) : (
                <EmptyNotice text="Choose a scenario and run a live analysis to inspect DIP outputs." />
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function HeaderStat({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-lg font-medium text-white">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-cyan-200" />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

function AlternativeCard({
  alternative,
  scenario,
  description,
  selected,
  onSelect,
  onChange,
}: {
  alternative: {
    id: string;
    label: string;
    features: Record<string, DipScalar>;
  };
  scenario: ObservatoryBootstrapPayload["scenarios"][number] | null;
  description: string | null;
  selected: boolean;
  onSelect: () => void;
  onChange: (fieldName: string, value: DipScalar) => void;
}) {
  if (!scenario) {
    return (
      <div className="rounded-[24px] border border-dashed border-white/10 bg-white/4 px-4 py-5 text-sm text-slate-400">
        Observatory needs a live DIP bootstrap payload before scenario inputs
        can be edited.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[24px] border p-4 transition",
        selected
          ? "border-cyan-300/35 bg-cyan-300/8"
          : "border-white/8 bg-white/4",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="text-sm font-medium text-white">{alternative.label}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
            {alternative.id}
          </p>
        </div>
        <Badge variant={selected ? "cyan" : "neutral"}>
          {selected ? "Selected" : "Inspect"}
        </Badge>
      </button>

      {description ? (
        <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
      ) : null}

      <div className="mt-4 grid gap-3">
        {scenario.fields.map((field) => {
          const value = alternative.features[field.name];

          return (
            <div key={`${alternative.id}-${field.name}`} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={`${alternative.id}-${field.name}`}>
                  {field.label}
                </Label>
                <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  {field.type}
                </span>
              </div>

              {field.type === "boolean" ? (
                <label className="flex h-11 items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white">
                  <span>
                    {typeof value === "boolean" && value
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                  <input
                    id={`${alternative.id}-${field.name}`}
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(event) =>
                      onChange(field.name, event.target.checked)
                    }
                    className="h-4 w-4 rounded border-white/20 bg-transparent accent-cyan-300"
                  />
                </label>
              ) : (
                <Input
                  id={`${alternative.id}-${field.name}`}
                  type={field.type === "number" ? "number" : "text"}
                  min={
                    field.type === "number"
                      ? (field.minValue ?? undefined)
                      : undefined
                  }
                  max={
                    field.type === "number"
                      ? (field.maxValue ?? undefined)
                      : undefined
                  }
                  step={
                    field.type === "number" ? (field.step ?? 0.1) : undefined
                  }
                  value={
                    typeof value === "string" || typeof value === "number"
                      ? String(value)
                      : ""
                  }
                  onChange={(event) => {
                    if (field.type === "number") {
                      const nextValue = event.target.value.trim();
                      onChange(
                        field.name,
                        nextValue.length === 0 ? 0 : Number(nextValue),
                      );
                      return;
                    }

                    onChange(field.name, event.target.value);
                  }}
                />
              )}

              {field.hint ? (
                <p className="text-xs leading-5 text-slate-500">{field.hint}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <span className="max-w-[60%] text-right text-sm text-slate-200">
        {value}
      </span>
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
    </div>
  );
}

function EmptyNotice({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-white/10 bg-white/4 px-4 py-5 text-sm leading-6 text-slate-400">
      {text}
    </div>
  );
}

function toneForRisk(risk: number) {
  if (risk >= 0.7) return "rose" as const;
  if (risk >= 0.45) return "amber" as const;
  return "emerald" as const;
}

function toneForConfidence(confidence: number) {
  if (confidence >= 0.75) return "emerald" as const;
  if (confidence >= 0.5) return "amber" as const;
  return "rose" as const;
}
