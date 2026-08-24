"use client";

import { useMemo } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DecisionAlternatives } from "@/eidos/components/decision-alternatives";
import { DecisionExplanation } from "@/eidos/components/decision-explanation";
import { DecisionHistory } from "@/eidos/components/decision-history";
import { DecisionOutcomes } from "@/eidos/components/decision-outcome";
import { DecisionReplay } from "@/eidos/components/decision-replay";
import { DecisionTradeoffChart } from "@/eidos/components/decision-tradeoff-chart";
import { ScenarioSelector } from "@/eidos/components/scenario-selector";
import {
  RISK_LABEL,
  RISK_TONE,
  STATUS_LABEL,
  STATUS_TONE,
  STRATEGY_LABEL,
  formatMwh,
} from "@/eidos/lib/eidos-format";
import {
  analyzeClient,
  explainScenarioShift,
} from "@/eidos/lib/eidos-decision";
import {
  buildDecisionHistory,
  buildDecisionOutcomes,
} from "@/eidos/data/synthetic-eidos-data";
import type { EidosClientSeed, EidosScenario } from "@/eidos/types/eidos";

type Props = {
  seed: EidosClientSeed;
  scenario: EidosScenario;
  onScenarioChange: (scenario: EidosScenario) => void;
  onClose: () => void;
};

export function ClientDecisionDetail({
  seed,
  scenario,
  onScenarioChange,
  onClose,
}: Props) {
  const analysis = useMemo(
    () => analyzeClient(seed, scenario),
    [seed, scenario],
  );
  const history = useMemo(() => buildDecisionHistory(seed), [seed]);
  const outcomes = useMemo(() => buildDecisionOutcomes(seed), [seed]);

  const { client, evaluations, recommended } = analysis;
  const original = history[0];
  const replayFactors = useMemo(
    () => explainScenarioShift(original.scenario, scenario),
    [original.scenario, scenario],
  );

  return (
    <div className="flex flex-col gap-4" data-testid="eidos-detail">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{client.name}</CardTitle>
              <Badge variant={STATUS_TONE[client.status]}>
                {STATUS_LABEL[client.status]}
              </Badge>
              <Badge variant={RISK_TONE[client.risk]}>
                {RISK_LABEL[client.risk]} risk
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              {client.id} · {formatMwh(client.annualConsumptionMwh)} annual
              consumption
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close decision detail"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <DecisionFact label="Current strategy">
            {STRATEGY_LABEL[client.currentStrategy]}
          </DecisionFact>
          <DecisionFact label="Recommended strategy" highlight>
            {STRATEGY_LABEL[client.recommendedStrategy]}
          </DecisionFact>
          <DecisionFact
            label="Decision changed"
            tone={client.decisionChanged ? "amber" : "emerald"}
          >
            {client.decisionChanged ? "YES" : "NO"}
          </DecisionFact>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scenario &amp; alternatives</CardTitle>
          <p className="text-sm text-slate-400">
            A change in assumptions can change the preferred decision. Switch
            scenarios to see cost, risk, confidence and ranking update.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <ScenarioSelector scenario={scenario} onChange={onScenarioChange} />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <DecisionAlternatives
              evaluations={evaluations}
              recommendedStrategy={recommended.strategy}
              currentStrategy={client.currentStrategy}
            />
            <DecisionTradeoffChart
              evaluations={evaluations}
              recommendedStrategy={recommended.strategy}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Why did the recommendation change?</CardTitle>
          </CardHeader>
          <CardContent>
            <DecisionExplanation
              factors={analysis.factors}
              currentStrategy={client.currentStrategy}
              recommendedStrategy={client.recommendedStrategy}
              decisionChanged={client.decisionChanged}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decision replay</CardTitle>
            <p className="text-sm text-slate-400">
              UI simulation only — the underlying decision engine is not
              modified.
            </p>
          </CardHeader>
          <CardContent>
            <DecisionReplay
              original={{
                scenario: original.scenario,
                strategy: original.strategy,
              }}
              current={{
                scenario,
                strategy: recommended.strategy,
              }}
              factors={replayFactors}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Decision history</CardTitle>
            <p className="text-sm text-slate-400">
              Twelve months of synthetic observations — decisions evolve over
              time.
            </p>
          </CardHeader>
          <CardContent>
            <DecisionHistory entries={history} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outcome tracking</CardTitle>
            <p className="text-sm text-slate-400">
              Recommended vs executed strategy and expected vs actual cost
              (synthetic).
            </p>
          </CardHeader>
          <CardContent>
            <DecisionOutcomes outcomes={outcomes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DecisionFact({
  label,
  children,
  highlight,
  tone,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
  tone?: "amber" | "emerald";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        highlight
          ? "border-cyan-300/30 bg-cyan-300/8"
          : "border-white/8 bg-white/4",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold",
          tone === "amber"
            ? "text-amber-200"
            : tone === "emerald"
              ? "text-emerald-200"
              : "text-white",
        )}
      >
        {children}
      </p>
    </div>
  );
}
