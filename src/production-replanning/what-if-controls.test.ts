/**
 * Scenario controls — full causal-chain tests.
 *
 * These tests verify that each UI control is correctly wired end-to-end:
 *
 *   Scenario Control (WhatIfState)
 *     → buildScenario  (mapping layer)
 *     → engine input   (capacityReductionFactor, durationDays, …)
 *     → capacities     (Line A t/day, totalCapacityTonnes)
 *     → feasibility    (FEASIBLE / INFEASIBLE per alternative)
 *     → cost           (financialImpact per alternative)
 *     → recommendation (recommendedAction, avoidedCostVsBaseline)
 *     → WHY            (explanation.reasons evidence text)
 *     → trace diff     (computeProductionTraceDiff rule-level changes)
 *
 * All numbers are derived deterministically from the engine — they match the
 * values in src/production-replanning/data/scenario.ts + engine.ts at the time
 * these tests were written. If the scenario data or cost config changes, update
 * the expected values in each comment-annotated section.
 *
 * SYNTHETIC DEMONSTRATION — not BTS & SAKER production data.
 */
import assert from "node:assert/strict";
import { test, describe } from "node:test";

import {
  runProductionReplanningEngine,
  DEFAULT_COST_CONFIG,
} from "@/production-replanning/lib/engine";
import {
  DEFAULT_SCENARIO,
  DEFAULT_REQUEST,
} from "@/production-replanning/data/scenario";
import {
  computeProductionTraceDiff,
  computeProductionDecisionDelta,
} from "@/production-replanning/lib/scenario-lab-helpers";
import {
  buildScenario,
  BASELINE_WHAT_IF,
} from "@/production-replanning/lib/what-if";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run the engine with a what-if state applied on top of DEFAULT_SCENARIO. */
function runWhatIf(patch: Partial<typeof BASELINE_WHAT_IF>) {
  const what = { ...BASELINE_WHAT_IF, ...patch };
  const scenario = buildScenario(DEFAULT_SCENARIO, what);
  return runProductionReplanningEngine({ scenario, costConfig: DEFAULT_COST_CONFIG });
}

/** Retrieve a specific rule result from a specific alternative. */
function getRule(
  result: ReturnType<typeof runProductionReplanningEngine>,
  actionId: string,
  ruleId: string,
) {
  return result.alternatives
    .find((a) => a.actionId === actionId)
    ?.ruleResults.find((r) => r.ruleId === ruleId);
}

// ---------------------------------------------------------------------------
// Section 1: buildScenario mapping layer
// ---------------------------------------------------------------------------
describe("buildScenario mapping", () => {
  test("baseline WhatIfState maps to DEFAULT_SCENARIO 1-for-1", () => {
    const s = buildScenario(DEFAULT_SCENARIO, BASELINE_WHAT_IF);
    // capacityReductionPct 30 → factor 0.30
    assert.equal(s.disruption.capacityReductionFactor, 0.30,
      "capacityReductionPct / 100 must equal disruption.capacityReductionFactor");
    // durationDays unchanged
    assert.equal(s.disruption.durationDays, BASELINE_WHAT_IF.disruptionDurationDays);
    // materialATonnes applied to MAT-A only
    const matA = s.materials.find((m) => m.id === "MAT-A");
    assert.equal(matA?.availableTonnes, BASELINE_WHAT_IF.materialATonnes);
    // criticalDeadlineDays applied to CRITICAL orders only
    for (const o of s.orders) {
      if (o.priority === "CRITICAL") {
        assert.equal(o.deadlineDays, BASELINE_WHAT_IF.criticalDeadlineDays);
      }
    }
    // overtime
    assert.equal(s.overtimeAvailable, BASELINE_WHAT_IF.overtimeAvailable);
  });

  test("non-MAT-A materials are not touched by materialATonnes change", () => {
    const original = DEFAULT_SCENARIO.materials.find((m) => m.id === "MAT-B")!;
    const s = buildScenario(DEFAULT_SCENARIO, { ...BASELINE_WHAT_IF, materialATonnes: 99 });
    const matB = s.materials.find((m) => m.id === "MAT-B")!;
    assert.equal(matB.availableTonnes, original.availableTonnes,
      "MAT-B must not be affected by materialATonnes change");
  });

  test("non-CRITICAL orders are not touched by criticalDeadlineDays change", () => {
    const s = buildScenario(DEFAULT_SCENARIO, { ...BASELINE_WHAT_IF, criticalDeadlineDays: 9 });
    for (const orig of DEFAULT_SCENARIO.orders) {
      if (orig.priority !== "CRITICAL") {
        const mapped = s.orders.find((o) => o.id === orig.id)!;
        assert.equal(mapped.deadlineDays, orig.deadlineDays,
          `${orig.id} (${orig.priority}) deadlineDays must be unchanged`);
      }
    }
  });

  test("buildScenario does not mutate the base scenario", () => {
    const snap = JSON.stringify(DEFAULT_SCENARIO);
    buildScenario(DEFAULT_SCENARIO, { ...BASELINE_WHAT_IF, capacityReductionPct: 50 });
    assert.equal(JSON.stringify(DEFAULT_SCENARIO), snap, "DEFAULT_SCENARIO must not be mutated");
  });
});

// ---------------------------------------------------------------------------
// Section 2: capacity reduction 30% → 50% — full causal chain
//
// Derived constants (from engine internals + probe script):
//   Line A: normalCapacityTpd=80, availabilityFactor=1.0 → normal=80 t/day
//   @30%: 80 × (1−0.30) = 56 t/day
//   @50%: 80 × (1−0.50) = 40 t/day
//   planHorizonDays = max(10,7,2)+2 = 12
//   Line B: 55 t/day (unaffected)
//   totalCapacityTonnes @30%: 56×3 + 80×9 + 55×12 = 168+720+660 = 1548 (disrupted-line contribution only)
//   but the engine uses effectiveCapacity across all lines, confirmed as 1791 from RULE-CAPACITY evidence
//   totalCapacityTonnes @50%: confirmed 1743 from RULE-CAPACITY evidence
//
//   KEEP_CURRENT_PLAN financialImpact.total: 97,671 → 221,100  (delta +123,429)
//   All other alternatives: costs unchanged
//   avoidedCostVsBaseline: 26,971 → 150,400
//   recommendedAction: REDISTRIBUTE_PRODUCTION (unchanged)
// ---------------------------------------------------------------------------
describe("capacity reduction 30%→50%: full causal chain", () => {
  const baseline = runProductionReplanningEngine(DEFAULT_REQUEST);
  const altered = runWhatIf({ capacityReductionPct: 50 });

  // ── Step 1: engine input ─────────────────────────────────────────────────
  test("step 1 — engine receives correct capacityReductionFactor", () => {
    // baseline comes from DEFAULT_REQUEST which uses DEFAULT_SCENARIO directly,
    // so check the what-if mapped scenario
    const mappedScenario = buildScenario(DEFAULT_SCENARIO, { ...BASELINE_WHAT_IF, capacityReductionPct: 50 });
    assert.equal(
      mappedScenario.disruption.capacityReductionFactor,
      0.5,
      "control value 50 ÷ 100 must produce capacityReductionFactor 0.5",
    );
    // scenarioSnapshot proves the engine consumed the updated value
    assert.equal(
      altered.scenarioSnapshot.disruption.capacityReductionFactor,
      0.5,
      "scenarioSnapshot must reflect the altered factor",
    );
  });

  // ── Step 2: Line A capacity ──────────────────────────────────────────────
  test("step 2 — Line A effective throughput drops from 56 to 40 t/day", () => {
    // RULE-CAPACITY evidence shows the total capacity figure consumed by the engine.
    // For REDISTRIBUTE_PRODUCTION the evidence string contains the effective total.
    const baseCapRule = getRule(baseline, "REDISTRIBUTE_PRODUCTION", "RULE-CAPACITY");
    const altCapRule  = getRule(altered,  "REDISTRIBUTE_PRODUCTION", "RULE-CAPACITY");

    assert.ok(baseCapRule?.evidence.includes("1791"),
      `baseline RULE-CAPACITY evidence must show 1791 t, got: ${baseCapRule?.evidence}`);
    assert.ok(altCapRule?.evidence.includes("1743"),
      `altered RULE-CAPACITY evidence must show 1743 t, got: ${altCapRule?.evidence}`);

    // Absolute capacity must be lower under higher reduction
    const baseNum = parseInt(baseCapRule!.evidence.match(/\d+/)![0], 10);
    const altNum  = parseInt(altCapRule!.evidence.match(/\d+/)![0], 10);
    assert.ok(altNum < baseNum,
      `total capacity at 50% (${altNum}) must be lower than at 30% (${baseNum})`);
  });

  // ── Step 3: feasibility set is unchanged ────────────────────────────────
  test("step 3 — feasibility status of each alternative is unchanged", () => {
    // Removing more capacity from the already-disrupted Line A doesn't change which
    // alternatives are FEASIBLE because RULE-CAPACITY checks total vs total required (270t)
    // and 1743t >> 270t. KEEP_CURRENT_PLAN remains INFEASIBLE for deadline reasons.
    for (const bAlt of baseline.alternatives) {
      const aAlt = altered.alternatives.find((a) => a.actionId === bAlt.actionId)!;
      assert.equal(
        aAlt.feasibility,
        bAlt.feasibility,
        `${bAlt.actionId}: feasibility must not change (both have excess capacity vs requirements)`,
      );
    }
  });

  // ── Step 4: cost impact is isolated to KEEP_CURRENT_PLAN ────────────────
  test("step 4 — only KEEP_CURRENT_PLAN cost increases; others are unchanged", () => {
    // KEEP_CURRENT_PLAN routes critical orders through the disrupted line;
    // halving that line's throughput (56→40 t/day) increases missed-deadline cost.
    const keepBase = baseline.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    const keepAlt  = altered.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;

    assert.equal(keepBase.financialImpact.total, 97671,
      "baseline KEEP_CURRENT_PLAN total must be 97,671");
    assert.equal(keepAlt.financialImpact.total, 221100,
      "altered KEEP_CURRENT_PLAN total must be 221,100 at 50% reduction");
    assert.ok(
      keepAlt.financialImpact.total > keepBase.financialImpact.total,
      "KEEP_CURRENT_PLAN cost must increase when capacity is more severely cut",
    );

    // All compensating alternatives must have identical costs (they don't route through
    // the disrupted line exclusively, so increasing that line's reduction changes
    // nothing in their financial calculations with the current cost model).
    const compensating: Array<typeof baseline.alternatives[0]["actionId"]> = [
      "REDISTRIBUTE_PRODUCTION",
      "PRIORITIZE_CRITICAL_ORDER",
      "DELAY_LOW_PRIORITY_ORDER",
    ];
    for (const actionId of compensating) {
      const bAlt = baseline.alternatives.find((a) => a.actionId === actionId)!;
      const aAlt = altered.alternatives.find((a) => a.actionId === actionId)!;
      assert.equal(
        aAlt.financialImpact.total,
        bAlt.financialImpact.total,
        `${actionId}: cost must not change — this action does not depend on affected-line-only throughput`,
      );
    }
  });

  // ── Step 5: recommendation unchanged, avoided cost grows ────────────────
  test("step 5 — recommendedAction stays REDISTRIBUTE_PRODUCTION; avoidedCost jumps", () => {
    assert.equal(baseline.recommendedAction, "REDISTRIBUTE_PRODUCTION");
    assert.equal(altered.recommendedAction,  "REDISTRIBUTE_PRODUCTION",
      "recommendation must remain REDISTRIBUTE_PRODUCTION — it was dominant and becomes more so");

    // avoidedCostVsBaseline = cost(KEEP_CURRENT_PLAN) − cost(recommended)
    // baseline: 97,671 − 70,700 = 26,971
    // altered:  221,100 − 70,700 = 150,400
    assert.equal(baseline.avoidedCostVsBaseline, 26971);
    assert.equal(altered.avoidedCostVsBaseline,  150400,
      "avoidedCostVsBaseline must increase because KEEP_CURRENT_PLAN became much more expensive");
    assert.ok(
      altered.avoidedCostVsBaseline > baseline.avoidedCostVsBaseline,
      "higher reduction makes the recommended action save more money",
    );
  });

  // ── Step 6: WHY (explanation evidence) ──────────────────────────────────
  test("step 6 — WHY: disruption evidence text updates to 50%", () => {
    const disruptionReason = altered.explanation.reasons.find(
      (r) => r.label === "Disruption adequately compensated",
    );
    assert.ok(disruptionReason, "explanation must include 'Disruption adequately compensated' reason");

    // Must reference the new remaining capacity (50%) and the new reduction (50%)
    assert.ok(
      disruptionReason.evidence.includes("50%"),
      `disruption evidence must reference 50%, got: ${disruptionReason.evidence}`,
    );
    assert.ok(
      disruptionReason.evidence.includes("−50%"),
      `disruption evidence must include −50% reduction, got: ${disruptionReason.evidence}`,
    );

    // Baseline evidence referenced 70% (remaining when 30% is removed)
    const baseDisruption = baseline.explanation.reasons.find(
      (r) => r.label === "Disruption adequately compensated",
    );
    assert.ok(baseDisruption?.evidence.includes("70%"),
      `baseline disruption evidence must reference 70%, got: ${baseDisruption?.evidence}`);
  });

  test("step 6 — WHY: savings figure in explanation matches avoidedCostVsBaseline", () => {
    // The "Lower total financial impact" reason must reference the new savings amount
    const savingsReason = altered.explanation.reasons.find(
      (r) => r.label === "Lower total financial impact",
    );
    assert.ok(savingsReason,
      "explanation must include 'Lower total financial impact' reason when recommended action saves money");
    // €150,400 formatted as "150,400"
    assert.ok(
      savingsReason.evidence.includes("150,400"),
      `savings evidence must mention the new €150,400 figure, got: ${savingsReason.evidence}`,
    );

    // Baseline savings was ~26,971 — must differ
    const baseSavings = baseline.explanation.reasons.find(
      (r) => r.label === "Lower total financial impact",
    );
    assert.notEqual(savingsReason.evidence, baseSavings?.evidence,
      "savings evidence must change when the cost gap between KEEP and REDISTRIBUTE widens");
  });

  // ── Step 7: RULE-DISRUPTION featureValues ────────────────────────────────
  test("step 7 — WHY: RULE-DISRUPTION featureValues.lineCapacityReductionPct = 50", () => {
    const rule = getRule(altered, "REDISTRIBUTE_PRODUCTION", "RULE-DISRUPTION");
    assert.ok(rule, "RULE-DISRUPTION must exist for REDISTRIBUTE_PRODUCTION");
    assert.equal(
      rule.featureValues["lineCapacityReductionPct"],
      50,
      "featureValues.lineCapacityReductionPct must equal 50 (not the system-wide ratio)",
    );
  });

  // ── Step 8: trace diff ───────────────────────────────────────────────────
  test("step 8 — trace diff: RULE-DISRUPTION and RULE-CAPACITY evidence change; pass/fail unchanged", () => {
    const diff = computeProductionTraceDiff(baseline, altered);

    const capDiff  = diff.find((d) => d.ruleId === "RULE-CAPACITY");
    const distDiff = diff.find((d) => d.ruleId === "RULE-DISRUPTION");
    const dlDiff   = diff.find((d) => d.ruleId === "RULE-CRITICAL-DEADLINE");

    assert.ok(capDiff,  "RULE-CAPACITY must appear in trace diff");
    assert.ok(distDiff, "RULE-DISRUPTION must appear in trace diff");
    assert.ok(dlDiff,   "RULE-CRITICAL-DEADLINE must appear in trace diff");

    // Pass/fail status must be unchanged for every rule
    for (const entry of diff) {
      assert.equal(
        entry.baselineResult,
        entry.scenarioResult,
        `${entry.ruleId}: pass/fail must not change — only the evidence text should update`,
      );
      assert.equal(entry.changed, false,
        `${entry.ruleId}: TraceDiffEntry.changed must be false`);
    }

    // RULE-CAPACITY evidence must differ (total tonnes changed: 1791 → 1743)
    assert.notEqual(capDiff.baselineEvidence, capDiff.scenarioEvidence,
      "RULE-CAPACITY evidence must change to reflect lower total capacity");
    assert.ok(capDiff.baselineEvidence.includes("1791"),
      `baseline RULE-CAPACITY evidence must contain 1791, got: ${capDiff.baselineEvidence}`);
    assert.ok(capDiff.scenarioEvidence.includes("1743"),
      `altered RULE-CAPACITY evidence must contain 1743, got: ${capDiff.scenarioEvidence}`);

    // RULE-DISRUPTION evidence must update from 70%/−30% to 50%/−50%
    assert.notEqual(distDiff.baselineEvidence, distDiff.scenarioEvidence,
      "RULE-DISRUPTION evidence must update when capacity reduction changes");
    assert.ok(distDiff.baselineEvidence.includes("70%") && distDiff.baselineEvidence.includes("−30%"),
      `baseline RULE-DISRUPTION evidence must reference 70% / −30%, got: ${distDiff.baselineEvidence}`);
    assert.ok(distDiff.scenarioEvidence.includes("50%") && distDiff.scenarioEvidence.includes("−50%"),
      `altered RULE-DISRUPTION evidence must reference 50% / −50%, got: ${distDiff.scenarioEvidence}`);

    // RULE-CRITICAL-DEADLINE completion day must change (critical orders complete slower on disrupted line)
    assert.notEqual(dlDiff.baselineEvidence, dlDiff.scenarioEvidence,
      "RULE-CRITICAL-DEADLINE evidence must shift — affected-line completion day changes");
    assert.ok(dlDiff.baselineEvidence.includes("0.9"),
      `baseline RULE-CRITICAL-DEADLINE evidence must show day 0.9, got: ${dlDiff.baselineEvidence}`);
    assert.ok(dlDiff.scenarioEvidence.includes("1.0"),
      `altered RULE-CRITICAL-DEADLINE evidence must show day 1.0, got: ${dlDiff.scenarioEvidence}`);
  });

  // ── Step 9: decision delta ───────────────────────────────────────────────
  test("step 9 — computeProductionDecisionDelta records the param change and cost shift", () => {
    const delta = computeProductionDecisionDelta(baseline, altered, {
      "Line A capacity reduction": { from: "30%", to: "50%" },
    });

    assert.equal(delta.baselineDecision, "REDISTRIBUTE_PRODUCTION");
    assert.equal(delta.scenarioDecision, "REDISTRIBUTE_PRODUCTION");
    assert.equal(delta.changed, false, "decision itself must not change");

    // changedReasons must record the param change
    assert.ok(
      delta.changedReasons.some((r) => r.includes("Line A capacity reduction")),
      `changedReasons must include the capacity reduction param, got: ${JSON.stringify(delta.changedReasons)}`,
    );
    assert.ok(
      delta.changedReasons.some((r) => r.includes("30%") && r.includes("50%")),
      `changedReasons must record the from/to values, got: ${JSON.stringify(delta.changedReasons)}`,
    );

    // financialDelta = cost(recommended@50%) − cost(recommended@30%) = 70,700 − 70,700 = 0
    assert.equal(delta.financialDelta, 0,
      "financialDelta for the recommended action must be 0 — REDISTRIBUTE_PRODUCTION cost is unchanged");

    // avoidedCostDelta = (150,400 − 26,971) = 123,429
    assert.equal(delta.avoidedCostDelta, 123429,
      "avoidedCostDelta must be 123,429 — the cost gap between KEEP and REDISTRIBUTE widened by that amount");
  });

  // ── Step 10: KEEP_CURRENT_PLAN trace evidence confirms line-level routing ──
  test("step 10 — KEEP_CURRENT_PLAN RULE-DISRUPTION evidence quantifies 50% correctly", () => {
    const rule = getRule(altered, "KEEP_CURRENT_PLAN", "RULE-DISRUPTION");
    assert.ok(rule, "RULE-DISRUPTION must exist for KEEP_CURRENT_PLAN");
    // Not compensating, but must still surface the actual reduction figures
    assert.ok(rule.evidence.includes("50%"),
      `KEEP_CURRENT_PLAN RULE-DISRUPTION evidence must reference 50% remaining, got: ${rule.evidence}`);
    assert.ok(rule.evidence.includes("−50%"),
      `KEEP_CURRENT_PLAN RULE-DISRUPTION evidence must include −50% reduction, got: ${rule.evidence}`);
    assert.equal(rule.passed, false,
      "KEEP_CURRENT_PLAN must not pass RULE-DISRUPTION (no compensating action)");
  });
});
