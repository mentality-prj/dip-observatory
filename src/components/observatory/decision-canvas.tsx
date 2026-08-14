"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";
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
import { usePathname, useRouter } from "next/navigation";

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
  "h-11 w-11 shrink-0 rounded-2xl border border-cyan-300/12 bg-cyan-300/8 p-2.5 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.14)]";

type LeftPanelTab = "catalog" | "inputs";
type RightPanelTab = "overview" | "alternatives" | "evidence";

export function DecisionCanvas({ initialPayload, initialLocale }: Props) {
  const locale = initialLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isLocalePending, startLocaleTransition] = useTransition();
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>("catalog");
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>("overview");
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
        <div className="flex justify-end">
          <div className="flex max-w-full flex-wrap items-center gap-2 rounded-[28px] border border-white/10 bg-white/5 px-4 py-3 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              {copy.localeLabel}
            </span>
            <div className="flex flex-wrap gap-1">
              {SUPPORTED_LOCALES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    if (option === locale) return;
                    startLocaleTransition(() => {
                      router.replace(buildLocalePath(pathname, option));
                    });
                  }}
                  disabled={isLocalePending}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm transition",
                    locale === option
                      ? "bg-cyan-300/20 text-cyan-50"
                      : "text-slate-400 hover:bg-white/8 hover:text-white",
                    isLocalePending &&
                      "cursor-not-allowed opacity-70 hover:bg-transparent hover:text-slate-400",
                  )}
                >
                  {copy.localeOptions[option]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <header className="grid gap-5 rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(11,17,31,0.96),rgba(7,10,18,0.98))] px-6 py-6 shadow-[0_24px_90px_rgba(0,0,0,0.32)] lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="cyan">DIP Observatory</Badge>
              <Badge
                variant={
                  activePayload.connection.configured ? "emerald" : "amber"
                }
              >
                {copy.shell.frontendClientOnly}
              </Badge>
              {demoMode.enabled ? (
                <Badge variant="amber">{demoMode.label}</Badge>
              ) : null}
              <Badge variant="neutral">
                {copy.shell.decisionSemanticsStay}
              </Badge>
            </div>
            <div>
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-[2.7rem]">
                {copy.shell.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
                {copy.shell.description}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <HeaderStat
              icon={Orbit}
              label={copy.stats.connection}
              value={
                activePayload.connection.configured
                  ? copy.stats.configured
                  : copy.stats.missing
              }
              detail={
                activePayload.connection.baseUrl ?? copy.stats.setDipConfig
              }
            />
            <HeaderStat
              icon={Layers3}
              label={copy.stats.scenarioCatalog}
              value={
                activePayload.connection.scenarioCatalogAvailable
                  ? `${localizedScenarios.length} ${copy.stats.scenariosUnit}`
                  : copy.stats.unavailable
              }
              detail={
                localizedScenario
                  ? `${localizedScenario.domain} · ${localizedScenario.modelId}`
                  : copy.stats.noScenarioSelected
              }
            />
            <HeaderStat
              icon={Gauge}
              label={copy.stats.runSurface}
              value={
                activePayload.connection.runSurfaceAvailable
                  ? copy.stats.ready
                  : copy.stats.unavailable
              }
              detail={copy.stats.runSurfaceDetail}
            />
            <HeaderStat
              icon={ArrowRightLeft}
              label={copy.stats.comparisonMode}
              value={`${localizedAlternatives.length} ${copy.stats.alternativesUnit}`}
              detail={copy.stats.comparisonModeDetail}
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
                {copy.actions.resetInputs}
              </Button>
            </div>
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_380px]">
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
              <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {copy.sections.selectedScenarioTitle}
                </p>
                <p className="mt-3 text-sm font-medium text-white">
                  {localizedScenario?.name ?? copy.notices.dipNotConnected}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
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
                        demoMode.lockScenario && item.id !== selectedScenarioId;

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
                    {status === "loading"
                      ? copy.actions.runningDip
                      : copy.actions.runLiveScenario}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{copy.sections.stateSpaceTitle}</CardTitle>
                    <CardDescription>
                      {copy.sections.stateSpaceDescription}
                    </CardDescription>
                  </div>
                  <Activity className={panelIconClass} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <StateSpaceChart
                  trajectories={deferredTrajectories}
                  selectedAlternativeId={selectedAlternativeId}
                  status={status}
                  hasRun={Boolean(runResponse)}
                  axisLabels={axisLabels}
                  copy={copy}
                  onSelect={selectAlternative}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{copy.sections.stateTimelineTitle}</CardTitle>
                <CardDescription>
                  {copy.sections.stateTimelineDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StateTimeline points={timeline} copy={copy} />
              </CardContent>
            </Card>
          </div>

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
                          subtitle={copy.sections.alternativeComparisonSubtitle}
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
                          <EmptyNotice text={copy.notices.runTwoAlternatives} />
                        )}
                      </div>

                      <div className="space-y-3">
                        <SectionTitle
                          title={copy.sections.decisionAlternativesTitle}
                          subtitle={copy.sections.decisionAlternativesSubtitle}
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
                                        {copy.labels.rank} {decisionOption.rank}
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
                                        {Math.round(decisionOption.risk * 100)}%
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
