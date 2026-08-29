"use client";

import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  Gauge,
  Pause,
  Play,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

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
import {
  buildLocalePath,
  getObservatoryCopy,
  localizeScenario,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/observatory-i18n";
import { cn } from "@/lib/utils";
import { useObservatoryStore } from "@/stores/observatory-store";

type Props = {
  initialPayload: ObservatoryBootstrapPayload;
  initialLocale: Locale;
};

const badgeTone = {
  cyan: "cyan",
  emerald: "emerald",
  amber: "amber",
  rose: "rose",
} as const;

const panelIconClass =
  "h-8 w-8 shrink-0 rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-400";

type LeftPanelTab = "catalog" | "inputs";
type RightPanelTab = "overview" | "alternatives" | "evidence";

export function DecisionCanvas({ initialPayload, initialLocale }: Props) {
  const locale = initialLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isLocalePending, startLocaleTransition] = useTransition();
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>("catalog");
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>("overview");
  // 0=idle 1=current 2=predicted+trajectory 3=futures+uncertainty 4=done
  const [revealStep, setRevealStep] = useState(0);
  // track scheduled timeouts so Stop can cancel them
  const pendingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const {
    bootstrap,
    demoMode,
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

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
  }, [locale]);

  const activePayload = bootstrap ?? initialPayload;
  const copy = getObservatoryCopy(locale);
  const leftTabs = [
    { id: "catalog", label: copy.tabs.catalog },
    { id: "inputs", label: copy.tabs.inputs },
  ] satisfies Array<{ id: LeftPanelTab; label: string }>;
  const rightTabs = [
    { id: "overview", label: copy.tabs.overview },
    { id: "alternatives", label: copy.tabs.alternatives },
    { id: "evidence", label: copy.tabs.evidence },
  ] satisfies Array<{ id: RightPanelTab; label: string }>;
  const localizedScenarios = activePayload.scenarios.map((item) =>
    localizeScenario(locale, item),
  );
  const localizedScenario = scenario
    ? localizeScenario(locale, scenario)
    : null;
  const localizedAlternatives = alternatives.map((alternative) => {
    const preset = localizedScenario?.presets.find(
      (item) => item.id === alternative.id,
    );

    return {
      ...alternative,
      label: preset?.label ?? alternative.label,
    };
  });
  const trajectories = buildStateSpaceTrajectories({
    scenario: localizedScenario,
    runResponse,
    copy,
  });
  const deferredTrajectories = useDeferredValue(trajectories);
  const selectedTrajectory =
    deferredTrajectories.find(
      (trajectory) => trajectory.id === selectedAlternativeId,
    ) ??
    deferredTrajectories[0] ??
    null;
  const metrics = buildMetricChips(selectedTrajectory, copy);
  const comparison = buildComparisonDeltas(deferredTrajectories, copy);
  const timeline = buildTimelinePoints(selectedTrajectory, copy);
  const axisLabels = scenario
    ? {
        x: localizedScenario?.stateAxes[0]?.label ?? copy.chart.axisFallbackX,
        y: localizedScenario?.stateAxes[1]?.label ?? copy.chart.axisFallbackY,
      }
    : null;
  const warnings = Array.from(
    new Set([...activePayload.warnings, ...(runResponse?.warnings ?? [])]),
  );

  const MAX_STEP = 4;
  const isPlaying =
    Boolean(runResponse) && revealStep > 0 && revealStep < MAX_STEP;
  const isDone = Boolean(runResponse) && revealStep >= MAX_STEP;

  function scheduleReveal() {
    const delays = [1600, 3400, 5400, 7800];
    pendingTimersRef.current = delays.map((delay, i) =>
      setTimeout(() => setRevealStep(i + 1), delay),
    );
  }

  function cancelTimers() {
    pendingTimersRef.current.forEach(clearTimeout);
    pendingTimersRef.current = [];
  }

  function handleStop() {
    cancelTimers();
  }

  function handlePlay() {
    if (!runResponse || revealStep >= MAX_STEP) return;
    cancelTimers();
    // schedule remaining steps relative to now
    const stepDelays = [900, 1900, 2900, 4100];
    const remaining = Array.from(
      { length: MAX_STEP - revealStep },
      (_, i) => revealStep + 1 + i,
    );
    pendingTimersRef.current = remaining.map((step, i) =>
      setTimeout(() => setRevealStep(step), stepDelays[i] ?? (i + 1) * 1000),
    );
  }

  function handleBack() {
    cancelTimers();
    setRevealStep((s) => Math.max(0, s - 1));
  }

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

      setRightPanelTab("overview");
      setRevealStep(0);
      cancelTimers();
      setSuccess(observatoryRunResponseSchema.parse(payload));
      scheduleReveal();
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
        {/* Compact top bar: title left, locale selector right */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-[0.22em] uppercase text-cyan-400">
                DIP Observatory
              </span>
              {demoMode.enabled ? (
                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[11px] text-amber-200">
                  {demoMode.label}
                </span>
              ) : null}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {localizedScenario?.name ?? copy.shell.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {copy.shell.frontendClientOnly} ·{" "}
              {copy.shell.decisionSemanticsStay}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={buildLocalePath("/eidos", locale)}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100 outline-none transition hover:border-cyan-200/60 hover:bg-cyan-300/16 focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              EIDOS Observatory
            </Link>
            <Link
              href={buildLocalePath("/supplier-decision", locale)}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100 outline-none transition hover:border-cyan-200/60 hover:bg-cyan-300/16 focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Supplier Decision
            </Link>
            <select
              value={locale}
              disabled={isLocalePending}
              onChange={(e) => {
                const next = e.target.value as Locale;
                if (next === locale) return;
                startLocaleTransition(() => {
                  router.replace(buildLocalePath(pathname, next));
                });
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 outline-none transition hover:border-white/20 disabled:opacity-60"
            >
              {SUPPORTED_LOCALES.map((option) => (
                <option key={option} value={option} className="bg-slate-900">
                  {copy.localeOptions[option]}
                </option>
              ))}
            </select>
          </div>
        </div>

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
                {copy.actions.resetInputs}
              </Button>
            </div>
          </div>
        ) : null}

        {/* Scenario + run bar — always above the chart */}
        <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
          <select
            value={selectedScenarioId ?? ""}
            disabled={demoMode.lockScenario}
            onChange={(e) => {
              setRevealStep(0);
              selectScenario(e.target.value);
            }}
            className="min-w-[180px] flex-1 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {localizedScenarios.map((item) => (
              <option key={item.id} value={item.id} className="bg-slate-900">
                {item.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hidden sm:inline">
              {localizedScenario?.domain}
            </span>
            {localizedAlternatives.length > 0 ? (
              <span className="rounded-full border border-white/10 px-2 py-0.5">
                {localizedAlternatives.length} {copy.stats.alternativesUnit}
              </span>
            ) : null}
          </div>

          <Button
            onClick={handleRun}
            data-loading={status === "loading" || undefined}
            disabled={
              !scenario ||
              !activePayload.connection.runSurfaceAvailable ||
              status === "loading"
            }
            className="ml-auto shrink-0"
          >
            <Play className="h-4 w-4" />
            {status === "loading"
              ? copy.actions.runningDip
              : copy.actions.runLiveScenario}
          </Button>

          {/* Animation controls — shown inline after Run */}
          {Boolean(runResponse) ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={revealStep === 0}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                title="Previous step"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {isPlaying ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 transition hover:bg-cyan-300/18"
                  title="Pause"
                >
                  <Pause className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePlay}
                  disabled={isDone}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 transition hover:bg-cyan-300/18 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Play"
                >
                  <Play className="h-4 w-4" />
                </button>
              )}

              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => {
                      cancelTimers();
                      setRevealStep(step);
                    }}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      revealStep >= step
                        ? "w-6 bg-cyan-300"
                        : "w-1.5 bg-white/20 hover:bg-white/40",
                    )}
                    title={
                      ["STATE", "ALTERNATIVES", "RISK", "DECISION"][step - 1]
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Chart is the focal point; side panels support it */}
        <section className="flex flex-col gap-6">
          {/* Chart: full-width, dominant — no outer card, SVG carries its own background */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between gap-3 px-1 pb-3">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {copy.sections.stateSpaceTitle}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {copy.sections.stateSpaceDescription}
                  </p>
                </div>
                <Activity className={panelIconClass} />
              </div>
              <StateSpaceChart
                trajectories={deferredTrajectories}
                selectedAlternativeId={selectedAlternativeId}
                status={status}
                hasRun={Boolean(runResponse)}
                revealStep={revealStep}
                axisLabels={axisLabels}
                copy={copy}
                onSelect={selectAlternative}
              />
            </div>

            <div>
              <div className="px-1 pb-3">
                <h2 className="text-base font-semibold text-white">
                  {copy.sections.stateTimelineTitle}
                </h2>
                <p className="text-sm text-slate-500">
                  {copy.sections.stateTimelineDescription}
                </p>
              </div>
              <StateTimeline
                points={timeline}
                copy={copy}
                activeIndex={revealStep > 0 ? revealStep - 1 : -1}
              />
            </div>
          </div>

          {/* Side panels: equal-width supporting panels */}
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{copy.sections.configurationTitle}</CardTitle>
                    <CardDescription>
                      {copy.sections.configurationDescription}
                    </CardDescription>
                  </div>
                  <Sparkles className={panelIconClass} />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {copy.sections.selectedScenarioTitle}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {localizedScenario?.name ?? copy.notices.dipNotConnected}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {localizedScenario?.description ??
                      copy.notices.bootstrapFromApi}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="cyan">
                      {localizedScenario?.domain ?? copy.labels.na}
                    </Badge>
                    <Badge variant="neutral">
                      {copy.labels.model}{" "}
                      {localizedScenario?.modelId ?? copy.labels.na}
                    </Badge>
                    <Badge variant="neutral">
                      {copy.labels.dataset}{" "}
                      {localizedScenario?.datasetId ?? copy.labels.na}
                    </Badge>
                  </div>
                </div>

                <PanelTabs
                  tabs={leftTabs}
                  value={leftPanelTab}
                  onChange={(value) => setLeftPanelTab(value as LeftPanelTab)}
                />

                {leftPanelTab === "catalog" ? (
                  <div className="space-y-3 rounded-[24px] border border-white/8 bg-white/4 p-4">
                    <SectionTitle
                      title={copy.sections.scenarioCatalogTitle}
                      subtitle={
                        demoMode.enabled
                          ? copy.sections.scenarioCatalogDemoSubtitle
                          : copy.sections.scenarioCatalogSubtitle
                      }
                    />
                    <div className="space-y-3">
                      {localizedScenarios.map((item) => {
                        const active = item.id === selectedScenarioId;
                        const disabled =
                          demoMode.lockScenario &&
                          item.id !== selectedScenarioId;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectScenario(item.id)}
                            disabled={disabled}
                            className={cn(
                              "rounded-[20px] border px-4 py-4 text-left transition",
                              active
                                ? "border-cyan-300/30 bg-cyan-300/10"
                                : "border-white/8 bg-slate-950/38 hover:border-white/14 hover:bg-white/6",
                              disabled &&
                                "cursor-not-allowed opacity-55 hover:border-white/8 hover:bg-slate-950/38",
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
                                {active
                                  ? copy.actions.selected
                                  : copy.actions.load}
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
                ) : (
                  <div className="space-y-5">
                    {localizedAlternatives.map((alternative) => (
                      <AlternativeCard
                        key={alternative.id}
                        alternative={alternative}
                        scenario={localizedScenario}
                        description={
                          localizedScenario?.presets.find(
                            (preset) => preset.id === alternative.id,
                          )?.description ?? null
                        }
                        copy={copy}
                        inputsLocked={demoMode.lockAlternatives}
                        selected={selectedAlternativeId === alternative.id}
                        onSelect={() => selectAlternative(alternative.id)}
                        onChange={(fieldName, value) =>
                          updateFeature(alternative.id, fieldName, value)
                        }
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{copy.sections.decisionAnalysisTitle}</CardTitle>
                    <CardDescription>
                      {copy.sections.decisionAnalysisDescription}
                    </CardDescription>
                  </div>
                  <Gauge className={panelIconClass} />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {selectedTrajectory ? (
                  <>
                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            {copy.labels.selectedPath}
                          </p>
                          <p className="mt-2 text-base font-medium text-white">
                            {selectedTrajectory.label}
                          </p>
                        </div>
                        <Badge
                          variant={badgeTone[metrics[0]?.tone ?? "cyan"]}
                          className="ml-auto shrink-0 whitespace-nowrap"
                        >
                          {metrics[0]?.value ?? copy.labels.na}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <PanelTabs
                          tabs={rightTabs}
                          value={rightPanelTab}
                          onChange={(value) =>
                            setRightPanelTab(value as RightPanelTab)
                          }
                        />
                      </div>
                    </div>

                    {rightPanelTab === "overview" ? (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {metrics.map((metric) => (
                            <div
                              key={metric.label}
                              className="rounded-[20px] border border-white/8 bg-white/5 p-4"
                            >
                              <div className="flex flex-wrap items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                                    {metric.label}
                                  </p>
                                  <p className="mt-2 text-sm font-medium text-white">
                                    {metric.value}
                                  </p>
                                </div>
                                <Badge
                                  variant={badgeTone[metric.tone]}
                                  className="ml-auto shrink-0 whitespace-nowrap"
                                >
                                  {metric.source === "api"
                                    ? copy.labels.apiBadge
                                    : copy.labels.comparisonBadge}
                                </Badge>
                              </div>
                              <p className="mt-2 text-xs leading-5 text-slate-400">
                                {metric.detail}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="grid gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4">
                          <DataRow
                            label={copy.labels.currentState}
                            value={
                              selectedTrajectory.metrics.currentState ||
                              copy.labels.na
                            }
                          />
                          <DataRow
                            label={copy.labels.predictedState}
                            value={selectedTrajectory.metrics.predictedState}
                          />
                          <DataRow
                            label={copy.labels.matchedRule}
                            value={selectedTrajectory.metrics.matchedRule}
                          />
                          <DataRow
                            label={copy.labels.execution}
                            value={`${selectedTrajectory.executionTimeMs} ms`}
                          />
                          <DataRow
                            label={copy.labels.uncertaintyInterval}
                            value={`${Math.round(selectedTrajectory.metrics.uncertainty * 100)}% ${copy.metrics.uncertaintyEnvelope}`}
                          />
                        </div>
                      </>
                    ) : null}

                    {rightPanelTab === "alternatives" ? (
                      <div className="space-y-5">
                        <div className="space-y-3">
                          <SectionTitle
                            title={copy.sections.alternativeComparisonTitle}
                            subtitle={
                              copy.sections.alternativeComparisonSubtitle
                            }
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
                            <EmptyNotice
                              text={copy.notices.runTwoAlternatives}
                            />
                          )}
                        </div>

                        <div className="space-y-3">
                          <SectionTitle
                            title={copy.sections.decisionAlternativesTitle}
                            subtitle={
                              copy.sections.decisionAlternativesSubtitle
                            }
                          />
                          {selectedTrajectory.alternativeDecisions.length >
                          0 ? (
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
                                          {copy.labels.rank}{" "}
                                          {decisionOption.rank}
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap justify-end gap-2">
                                        <Badge
                                          variant={
                                            decisionOption.selected
                                              ? "cyan"
                                              : toneForRisk(decisionOption.risk)
                                          }
                                          className="shrink-0 whitespace-nowrap"
                                        >
                                          {copy.labels.riskShort}{" "}
                                          {Math.round(
                                            decisionOption.risk * 100,
                                          )}
                                          %
                                        </Badge>
                                        <Badge
                                          variant={toneForConfidence(
                                            decisionOption.confidence,
                                          )}
                                          className="shrink-0 whitespace-nowrap"
                                        >
                                          {copy.labels.confidenceShort}{" "}
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
                            <EmptyNotice
                              text={copy.notices.noAlternativeDecisions}
                            />
                          )}
                        </div>
                      </div>
                    ) : null}

                    {rightPanelTab === "evidence" ? (
                      <div className="space-y-5">
                        <div className="space-y-3">
                          <SectionTitle
                            title={copy.sections.whyDecisionTitle}
                            subtitle={copy.sections.whyDecisionSubtitle}
                          />
                          {selectedTrajectory.explanationBullets.length > 0 ? (
                            <ul className="space-y-2">
                              {selectedTrajectory.explanationBullets.map(
                                (bullet) => (
                                  <li
                                    key={bullet}
                                    className="rounded-[18px] border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300"
                                  >
                                    {bullet}
                                  </li>
                                ),
                              )}
                            </ul>
                          ) : (
                            <EmptyNotice text={copy.notices.noExplanation} />
                          )}
                        </div>

                        <div className="space-y-3">
                          <SectionTitle
                            title={copy.sections.ruleEvidenceTitle}
                            subtitle={copy.sections.ruleEvidenceSubtitle}
                          />
                          {selectedTrajectory.evidenceBullets.length > 0 ? (
                            <ul className="space-y-2">
                              {selectedTrajectory.evidenceBullets.map(
                                (bullet) => (
                                  <li
                                    key={bullet}
                                    className="rounded-[18px] border border-white/8 bg-slate-950/48 px-4 py-3 text-sm text-slate-300"
                                  >
                                    {bullet}
                                  </li>
                                ),
                              )}
                            </ul>
                          ) : (
                            <EmptyNotice text={copy.notices.noRuleEvidence} />
                          )}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <EmptyNotice text={copy.notices.chooseScenario} />
                )}
              </CardContent>
            </Card>
          </div>
          {/* end side panels grid */}
        </section>
      </div>
    </main>
  );
}

function AlternativeCard({
  alternative,
  scenario,
  description,
  copy,
  inputsLocked,
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
  copy: ReturnType<typeof getObservatoryCopy>;
  inputsLocked: boolean;
  selected: boolean;
  onSelect: () => void;
  onChange: (fieldName: string, value: DipScalar) => void;
}) {
  if (!scenario) {
    return (
      <div className="rounded-[24px] border border-dashed border-white/10 bg-white/4 px-4 py-5 text-sm text-slate-400">
        {copy.notices.observatoryNeedsPayload}
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
          {selected ? copy.actions.selected : copy.actions.inspect}
        </Badge>
      </button>

      {description ? (
        <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
      ) : null}

      {inputsLocked ? (
        <p className="mt-3 rounded-2xl border border-amber-300/14 bg-amber-300/8 px-3 py-2 text-xs leading-5 text-amber-100/90">
          {copy.notices.demoInputsLocked}
        </p>
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
                  {copy.fieldTypes[field.type]}
                </span>
              </div>

              {field.type === "boolean" ? (
                <label className="flex h-11 items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white">
                  <span>
                    {typeof value === "boolean" && value
                      ? copy.fieldTypes.enabled
                      : copy.fieldTypes.disabled}
                  </span>
                  <input
                    id={`${alternative.id}-${field.name}`}
                    type="checkbox"
                    checked={Boolean(value)}
                    disabled={inputsLocked}
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
                  disabled={inputsLocked}
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

function PanelTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ id: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-white/10 bg-white/5 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] transition",
            value === tab.id
              ? "bg-cyan-300/18 text-cyan-50"
              : "text-slate-400 hover:bg-white/8 hover:text-white",
          )}
        >
          {tab.label}
        </button>
      ))}
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
