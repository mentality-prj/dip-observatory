"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, FlaskConical } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientDecisionDetail } from "@/eidos/components/client-decision-detail";
import { EidosLocaleSwitcher } from "@/eidos/components/eidos-locale-switcher";
import {
  ClientTable,
  type SortDirection,
  type SortKey,
} from "@/eidos/components/client-table";
import { EidosOverview } from "@/eidos/components/eidos-overview";
import { getEidosCopy } from "@/eidos/lib/eidos-i18n";
import { STATUS_PRIORITY } from "@/eidos/lib/eidos-format";
import { resolveClient, summarizePortfolio } from "@/eidos/lib/eidos-decision";
import {
  EIDOS_CLIENT_SEEDS,
  EIDOS_DEMO_CLIENT_ID,
  getClientSeed,
} from "@/eidos/data/synthetic-eidos-data";
import type {
  ClientRisk,
  DecisionStatus,
  EidosClient,
  EidosScenario,
  ProcurementStrategy,
} from "@/eidos/types/eidos";
import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";

/** The portfolio is always monitored at BASELINE; scenarios are explored per client. */
const MONITORED_SCENARIO: EidosScenario = "BASELINE";

const STRATEGY_ORDER: Record<ProcurementStrategy, number> = {
  WAIT: 0,
  BUY_20: 1,
  BUY_40: 2,
};
const RISK_ORDER: Record<ClientRisk, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

type Props = {
  locale: Locale;
};

export function EidosWorkspace({ locale }: Props) {
  const copy = getEidosCopy(locale);
  const baselineClients = useMemo<EidosClient[]>(
    () =>
      EIDOS_CLIENT_SEEDS.map((seed) => resolveClient(seed, MONITORED_SCENARIO)),
    [],
  );
  const summary = useMemo(
    () => summarizePortfolio(baselineClients),
    [baselineClients],
  );

  const [statusFilter, setStatusFilter] = useState<DecisionStatus | "ALL">(
    "ALL",
  );
  const [riskFilter, setRiskFilter] = useState<ClientRisk | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    EIDOS_DEMO_CLIENT_ID,
  );
  const [scenario, setScenario] = useState<EidosScenario>("BASELINE");

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = baselineClients.filter((client) => {
      if (statusFilter !== "ALL" && client.status !== statusFilter) {
        return false;
      }
      if (riskFilter !== "ALL" && client.risk !== riskFilter) {
        return false;
      }
      if (query && !client.name.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });

    const direction = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const primary = compareBy(a, b, sortKey) * direction;
      if (primary !== 0) return primary;
      return a.name.localeCompare(b.name);
    });
  }, [
    baselineClients,
    statusFilter,
    riskFilter,
    search,
    sortKey,
    sortDirection,
  ]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    // Numeric / priority columns default to descending, text to ascending.
    setSortDirection(key === "name" ? "asc" : "desc");
  }

  function handleSelectStatus(next: DecisionStatus | "ALL") {
    setStatusFilter((current) => (current === next ? "ALL" : next));
  }

  const selectedSeed = selectedClientId
    ? getClientSeed(selectedClientId)
    : undefined;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 md:px-6 xl:px-10">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
                {copy.header.eyebrow}
              </span>
              <Badge variant="amber" className="gap-1.5">
                <FlaskConical className="h-3 w-3" aria-hidden="true" />
                {copy.header.prototypeBadge}
              </Badge>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {copy.header.title}
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              {copy.header.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <EidosLocaleSwitcher locale={locale} />
            <Button asChild size="sm">
              <Link href={buildLocalePath("/eidos/documentation", locale)}>
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                {copy.header.openDocumentationPage}
              </Link>
            </Button>
            <Link
              href={buildLocalePath("/", locale)}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-2 text-sm text-slate-300 outline-none transition hover:border-white/25 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {copy.header.backLink}
            </Link>
          </div>
        </header>

        <EidosOverview
          locale={locale}
          summary={summary}
          activeStatusFilter={statusFilter}
          onSelectStatus={handleSelectStatus}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>{copy.table.title}</CardTitle>
              <p className="text-sm text-slate-400">
                {copy.table.attentionSummary(
                  summary.needsAttention,
                  summary.total,
                )}
              </p>
            </CardHeader>
            <CardContent>
              <ClientTable
                locale={locale}
                rows={visibleRows}
                totalCount={baselineClients.length}
                selectedClientId={selectedClientId}
                onSelect={setSelectedClientId}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
                search={search}
                onSearch={setSearch}
                riskFilter={riskFilter}
                onRiskFilter={setRiskFilter}
              />
            </CardContent>
          </Card>

          {selectedSeed ? (
            <ClientDecisionDetail
              locale={locale}
              seed={selectedSeed}
              scenario={scenario}
              onScenarioChange={setScenario}
              onClose={() => setSelectedClientId(null)}
            />
          ) : (
            <Card className="flex items-center justify-center">
              <CardContent className="py-16 text-center text-sm text-slate-400">
                {copy.detail.emptyState}
              </CardContent>
            </Card>
          )}
        </div>

        <p className="text-center text-xs text-slate-600">
          {copy.footerDisclaimer}
        </p>
      </div>
    </main>
  );
}

function compareBy(a: EidosClient, b: EidosClient, key: SortKey): number {
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name);
    case "annualConsumptionMwh":
      return a.annualConsumptionMwh - b.annualConsumptionMwh;
    case "currentStrategy":
      return (
        STRATEGY_ORDER[a.currentStrategy] - STRATEGY_ORDER[b.currentStrategy]
      );
    case "recommendedStrategy":
      return (
        STRATEGY_ORDER[a.recommendedStrategy] -
        STRATEGY_ORDER[b.recommendedStrategy]
      );
    case "risk":
      return RISK_ORDER[a.risk] - RISK_ORDER[b.risk];
    case "status":
      return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    default:
      return 0;
  }
}
