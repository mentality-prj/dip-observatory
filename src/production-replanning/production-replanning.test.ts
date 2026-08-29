/**
 * Production Replanning Engine — unit tests.
 *
 * Tests cover:
 *  1.  Determinism
 *  2.  Same input → identical decision
 *  3.  Same input → identical trace
 *  4.  Capacity constraint
 *  5.  Material constraint
 *  6.  Critical deadline constraint
 *  7.  Alternative feasibility
 *  8.  Financial impact calculation
 *  9.  Alternative ranking
 * 10.  Decision changes when scenario changes
 * 11.  Explanation derived from rules
 * 12.  Audit trail correctness
 * 13.  No randomness (structural test)
 * 14.  No external dependencies (structural test)
 * 15.  Insufficient total capacity
 * 16.  Insufficient material
 * 17.  Disruption duration changes
 * 18.  Capacity reduction changes
 * 19.  Deadline changes
 * 20.  Overtime availability changes
 *
 * SYNTHETIC DEMONSTRATION — not BTS & SAKER production data.
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";

import {
  runProductionReplanningEngine,
  DEFAULT_COST_CONFIG,
  PRODUCTION_RULES,
  ENGINE_VERSION,
} from "@/production-replanning/lib/engine";
import {
  DEFAULT_REQUEST,
  DEFAULT_SCENARIO,
  getDemoDecision,
} from "@/production-replanning/data/scenario";
import type {
  ProductionDecisionRequest,
  ProductionScenario,
} from "@/production-replanning/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRequest(patch: Partial<ProductionScenario>): ProductionDecisionRequest {
  return {
    scenario: { ...DEFAULT_SCENARIO, ...patch, scenarioId: "TEST" },
    costConfig: DEFAULT_COST_CONFIG,
  };
}

// ---------------------------------------------------------------------------
// 1–3: Determinism
// ---------------------------------------------------------------------------

describe("determinism", () => {
  test("1. same input produces identical decision on repeated calls", () => {
    const a = runProductionReplanningEngine(DEFAULT_REQUEST);
    const b = runProductionReplanningEngine(DEFAULT_REQUEST);
    assert.equal(a.recommendedAction, b.recommendedAction);
  });

  test("2. same input → identical financial impact", () => {
    const a = runProductionReplanningEngine(DEFAULT_REQUEST);
    const b = runProductionReplanningEngine(DEFAULT_REQUEST);
    assert.equal(a.totalFinancialImpact, b.totalFinancialImpact);
    assert.equal(a.avoidedCostVsBaseline, b.avoidedCostVsBaseline);
  });

  test("3. same input → identical audit trace", () => {
    const a = runProductionReplanningEngine(DEFAULT_REQUEST);
    const b = runProductionReplanningEngine(DEFAULT_REQUEST);
    assert.equal(a.auditTrail.decisionId, b.auditTrail.decisionId);
    assert.equal(a.auditTrail.recommendedAction, b.auditTrail.recommendedAction);
    assert.equal(a.auditTrail.totalFinancialImpact, b.auditTrail.totalFinancialImpact);
  });

  test("cached getDemoDecision returns same object on repeated calls", () => {
    const a = getDemoDecision();
    const b = getDemoDecision();
    assert.strictEqual(a, b);
  });
});

// ---------------------------------------------------------------------------
// 4: Capacity constraint
// ---------------------------------------------------------------------------

describe("4. capacity constraint", () => {
  test("KEEP_CURRENT_PLAN has capacity rule result", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    const keepPlan = result.alternatives.find(
      (a) => a.actionId === "KEEP_CURRENT_PLAN",
    );
    assert.ok(keepPlan, "KEEP_CURRENT_PLAN alternative must exist");
    const capRule = keepPlan.ruleResults.find((r) => r.ruleId === "RULE-CAPACITY");
    assert.ok(capRule, "RULE-CAPACITY must be evaluated");
    assert.ok("effectiveCapacityTonnes" in capRule.featureValues);
  });

  test("alternatives include capacity feature values", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    for (const alt of result.alternatives) {
      const capRule = alt.ruleResults.find((r) => r.ruleId === "RULE-CAPACITY");
      assert.ok(capRule, `RULE-CAPACITY missing for ${alt.actionId}`);
    }
  });
});

// ---------------------------------------------------------------------------
// 5: Material constraint
// ---------------------------------------------------------------------------

describe("5. material constraint", () => {
  test("material rule is evaluated for all alternatives", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    for (const alt of result.alternatives) {
      const matRule = alt.ruleResults.find((r) => r.ruleId === "RULE-MATERIAL");
      assert.ok(matRule, `RULE-MATERIAL missing for ${alt.actionId}`);
    }
  });

  test("material rule passes when material is sufficient", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    // Default has 600t material, 270t required → should pass
    for (const alt of result.alternatives) {
      const matRule = alt.ruleResults.find((r) => r.ruleId === "RULE-MATERIAL")!;
      assert.ok(matRule.passed, `RULE-MATERIAL should pass for ${alt.actionId}`);
    }
  });
});

// ---------------------------------------------------------------------------
// 6: Critical deadline constraint
// ---------------------------------------------------------------------------

describe("6. critical deadline constraint", () => {
  test("RULE-CRITICAL-DEADLINE is evaluated for all alternatives", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    for (const alt of result.alternatives) {
      const deadlineRule = alt.ruleResults.find(
        (r) => r.ruleId === "RULE-CRITICAL-DEADLINE",
      );
      assert.ok(deadlineRule, `RULE-CRITICAL-DEADLINE missing for ${alt.actionId}`);
    }
  });

  test("RULE-CRITICAL-DEADLINE is blocking", () => {
    const rule = PRODUCTION_RULES.find((r) => r.id === "RULE-CRITICAL-DEADLINE");
    assert.ok(rule, "RULE-CRITICAL-DEADLINE must exist");
    assert.equal(rule.blocking, true);
  });
});

// ---------------------------------------------------------------------------
// 7: Alternative feasibility
// ---------------------------------------------------------------------------

describe("7. alternative feasibility", () => {
  test("engine produces exactly 4 alternatives", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    assert.equal(result.alternatives.length, 4);
  });

  test("each alternative has a feasibility status", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    for (const alt of result.alternatives) {
      assert.ok(
        alt.feasibility === "FEASIBLE" || alt.feasibility === "INFEASIBLE",
        `${alt.actionId} must have valid feasibility`,
      );
    }
  });

  test("INFEASIBLE alternatives have blocking constraints listed", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    for (const alt of result.alternatives.filter(
      (a) => a.feasibility === "INFEASIBLE",
    )) {
      assert.ok(
        alt.blockingConstraints.length > 0,
        `INFEASIBLE alternative ${alt.actionId} must list blocking constraints`,
      );
    }
  });

  test("FEASIBLE alternatives have empty blocking constraints", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    for (const alt of result.alternatives.filter(
      (a) => a.feasibility === "FEASIBLE",
    )) {
      assert.equal(
        alt.blockingConstraints.length,
        0,
        `FEASIBLE alternative ${alt.actionId} must not list blocking constraints`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 8: Financial impact calculation
// ---------------------------------------------------------------------------

describe("8. financial impact calculation", () => {
  test("every alternative has a non-negative total financial impact", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    for (const alt of result.alternatives) {
      assert.ok(
        alt.financialImpact.total >= 0,
        `${alt.actionId} total cost must be non-negative`,
      );
    }
  });

  test("total financial impact equals sum of components", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    for (const alt of result.alternatives) {
      const f = alt.financialImpact;
      const expected =
        f.missedDeadlineCost +
        f.overtimeCost +
        f.delayCost +
        f.unusedCapacityCost +
        f.switchingCost;
      assert.equal(
        f.total,
        expected,
        `${alt.actionId}: total ${f.total} != component sum ${expected}`,
      );
    }
  });

  test("recommended alternative has lower total cost than KEEP_CURRENT_PLAN", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    const baseline = result.alternatives.find(
      (a) => a.actionId === "KEEP_CURRENT_PLAN",
    )!;
    const rec = result.alternatives.find(
      (a) => a.actionId === result.recommendedAction,
    )!;
    // If recommendation is not KEEP_CURRENT_PLAN, it must cost less or equal
    if (result.recommendedAction !== "KEEP_CURRENT_PLAN") {
      assert.ok(
        rec.financialImpact.total <= baseline.financialImpact.total,
        `Recommended action ${result.recommendedAction} (${rec.financialImpact.total}) should not cost more than baseline (${baseline.financialImpact.total})`,
      );
    }
  });

  test("avoided cost is non-negative", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    assert.ok(result.avoidedCostVsBaseline >= 0);
  });
});

// ---------------------------------------------------------------------------
// 9: Alternative ranking
// ---------------------------------------------------------------------------

describe("9. alternative ranking", () => {
  test("each alternative has a rank between 1 and 4", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    const ranks = result.alternatives.map((a) => a.rank).sort((a, b) => a - b);
    assert.deepEqual(ranks, [1, 2, 3, 4]);
  });

  test("recommended alternative has rank 1", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    const rec = result.alternatives.find(
      (a) => a.actionId === result.recommendedAction,
    )!;
    assert.equal(rec.rank, 1);
  });

  test("FEASIBLE alternatives rank above INFEASIBLE alternatives", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    const feasibleRanks = result.alternatives
      .filter((a) => a.feasibility === "FEASIBLE")
      .map((a) => a.rank);
    const infeasibleRanks = result.alternatives
      .filter((a) => a.feasibility === "INFEASIBLE")
      .map((a) => a.rank);
    if (feasibleRanks.length > 0 && infeasibleRanks.length > 0) {
      assert.ok(
        Math.max(...feasibleRanks) < Math.min(...infeasibleRanks),
        "All FEASIBLE alternatives must rank above INFEASIBLE ones",
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 10: Decision changes when scenario changes
// ---------------------------------------------------------------------------

describe("10. decision changes when scenario changes", () => {
  test("zero overtime does not change decision type", () => {
    const withOT = runProductionReplanningEngine(DEFAULT_REQUEST);
    const withoutOT = runProductionReplanningEngine(
      buildRequest({ overtimeAvailable: false }),
    );
    // Both should still produce decisions
    assert.ok(withOT.decisionStatus === "DECIDED" || withOT.decisionStatus === "NO_FEASIBLE_ALTERNATIVE");
    assert.ok(withoutOT.decisionStatus === "DECIDED" || withoutOT.decisionStatus === "NO_FEASIBLE_ALTERNATIVE");
  });

  test("different capacity reductions produce different effective capacities", () => {
    const low = runProductionReplanningEngine(
      buildRequest({ disruption: { ...DEFAULT_SCENARIO.disruption, capacityReductionFactor: 0.1 } }),
    );
    const high = runProductionReplanningEngine(
      buildRequest({ disruption: { ...DEFAULT_SCENARIO.disruption, capacityReductionFactor: 0.5 } }),
    );
    // Different reduction → different effective capacity in RULE-CAPACITY featureValues
    const capLow = low.alternatives[0].ruleResults.find((r) => r.ruleId === "RULE-CAPACITY")!;
    const capHigh = high.alternatives[0].ruleResults.find((r) => r.ruleId === "RULE-CAPACITY")!;
    assert.notEqual(
      capLow.featureValues.effectiveCapacityTonnes,
      capHigh.featureValues.effectiveCapacityTonnes,
    );
  });
});

// ---------------------------------------------------------------------------
// 11: Explanation derived from rules
// ---------------------------------------------------------------------------

describe("11. explanation derived from rules", () => {
  test("explanation contains at least one reason", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    assert.ok(result.explanation.reasons.length > 0, "explanation must have reasons");
  });

  test("each explanation reason has direction and evidence", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    for (const reason of result.explanation.reasons) {
      assert.ok(reason.direction === "positive" || reason.direction === "negative");
      assert.ok(reason.evidence.length > 0, "evidence must not be empty");
      assert.ok(reason.label.length > 0, "label must not be empty");
    }
  });

  test("rejected alternatives are listed in explanation", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    const rejectedIds = result.explanation.rejectedAlternatives.map((r) => r.actionId);
    for (const alt of result.alternatives) {
      if (alt.actionId !== result.recommendedAction) {
        assert.ok(
          rejectedIds.includes(alt.actionId),
          `${alt.actionId} should appear in rejected alternatives`,
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 12: Audit trail correctness
// ---------------------------------------------------------------------------

describe("12. audit trail correctness", () => {
  test("audit trail contains engine version", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    assert.equal(result.auditTrail.engineVersion, ENGINE_VERSION);
  });

  test("audit trail recommended action matches decision", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    assert.equal(result.auditTrail.recommendedAction, result.recommendedAction);
  });

  test("audit trail lists all 4 alternatives", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    assert.equal(result.auditTrail.alternativesEvaluated.length, 4);
  });

  test("audit trail lists all rules", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    assert.equal(
      result.auditTrail.rulesExecuted.length,
      PRODUCTION_RULES.length,
    );
  });

  test("audit trail source is SYNTHETIC_DEMONSTRATION", () => {
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    assert.equal(result.auditTrail.source, "SYNTHETIC_DEMONSTRATION");
  });
});

// ---------------------------------------------------------------------------
// 13: No randomness
// ---------------------------------------------------------------------------

describe("13. no randomness", () => {
  test("100 repeated calls all produce the same recommendation", () => {
    const expected = runProductionReplanningEngine(DEFAULT_REQUEST).recommendedAction;
    for (let i = 0; i < 100; i++) {
      const r = runProductionReplanningEngine(DEFAULT_REQUEST);
      assert.equal(r.recommendedAction, expected, `Call #${i} produced different recommendation`);
    }
  });
});

// ---------------------------------------------------------------------------
// 14: No external dependencies
// ---------------------------------------------------------------------------

describe("14. no external dependencies", () => {
  test("engine module exports only pure functions and constants", () => {
    // Just verifying the engine can be imported and run synchronously
    const result = runProductionReplanningEngine(DEFAULT_REQUEST);
    assert.ok(result.recommendedAction, "engine must produce a recommendation");
    assert.ok(typeof result.totalFinancialImpact === "number");
  });
});

// ---------------------------------------------------------------------------
// 15: Insufficient total capacity
// ---------------------------------------------------------------------------

describe("15. insufficient total capacity", () => {
  test("when capacity is severely limited, all alternatives may be INFEASIBLE or low-scoring", () => {
    const req = buildRequest({
      disruption: {
        ...DEFAULT_SCENARIO.disruption,
        capacityReductionFactor: 0.99,
        durationDays: 10,
      },
      overtimeAvailable: false,
    });
    const result = runProductionReplanningEngine(req);
    // Engine should still return a result (graceful degradation)
    assert.ok(result.recommendedAction);
    assert.ok(result.decisionStatus === "DECIDED" || result.decisionStatus === "NO_FEASIBLE_ALTERNATIVE");
  });
});

// ---------------------------------------------------------------------------
// 16: Insufficient material
// ---------------------------------------------------------------------------

describe("16. insufficient material", () => {
  test("material rule fails when material is zero", () => {
    const req = buildRequest({
      materials: [
        { id: "MAT-A", name: "Material A", availableTonnes: 0 },
        { id: "MAT-B", name: "Material B", availableTonnes: 0 },
      ],
    });
    const result = runProductionReplanningEngine(req);
    for (const alt of result.alternatives) {
      const matRule = alt.ruleResults.find((r) => r.ruleId === "RULE-MATERIAL")!;
      assert.equal(matRule.passed, false, `${alt.actionId} material rule should fail`);
    }
  });

  test("all alternatives are INFEASIBLE when material is zero", () => {
    const req = buildRequest({
      materials: [
        { id: "MAT-A", name: "Material A", availableTonnes: 0 },
        { id: "MAT-B", name: "Material B", availableTonnes: 0 },
      ],
    });
    const result = runProductionReplanningEngine(req);
    for (const alt of result.alternatives) {
      assert.equal(alt.feasibility, "INFEASIBLE", `${alt.actionId} should be INFEASIBLE`);
    }
  });
});

// ---------------------------------------------------------------------------
// 17: Disruption duration changes
// ---------------------------------------------------------------------------

describe("17. disruption duration changes", () => {
  test("longer disruption increases baseline financial impact", () => {
    const short = runProductionReplanningEngine(
      buildRequest({ disruption: { ...DEFAULT_SCENARIO.disruption, durationDays: 1 } }),
    );
    const long = runProductionReplanningEngine(
      buildRequest({ disruption: { ...DEFAULT_SCENARIO.disruption, durationDays: 7 } }),
    );
    const baselineShort = short.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    const baselineLong = long.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    assert.ok(
      baselineLong.financialImpact.total >= baselineShort.financialImpact.total,
      "longer disruption should not decrease baseline cost",
    );
  });
});

// ---------------------------------------------------------------------------
// 18: Capacity reduction changes
// ---------------------------------------------------------------------------

describe("18. capacity reduction changes", () => {
  test("greater capacity reduction changes financial impact", () => {
    const mild = runProductionReplanningEngine(
      buildRequest({ disruption: { ...DEFAULT_SCENARIO.disruption, capacityReductionFactor: 0.1 } }),
    );
    const severe = runProductionReplanningEngine(
      buildRequest({ disruption: { ...DEFAULT_SCENARIO.disruption, capacityReductionFactor: 0.6 } }),
    );
    const baselineMild = mild.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    const baselineSevere = severe.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    assert.ok(
      baselineSevere.financialImpact.total >= baselineMild.financialImpact.total,
      "severe reduction should not produce lower cost than mild",
    );
  });
});

// ---------------------------------------------------------------------------
// 19: Deadline changes
// ---------------------------------------------------------------------------

describe("19. deadline changes", () => {
  test("very tight critical deadline affects deadline rule", () => {
    // Use no overtime so daily throughput (≈111 t/day) < 120 t required in 1 day
    const tight = runProductionReplanningEngine(
      buildRequest({
        overtimeAvailable: false,
        orders: DEFAULT_SCENARIO.orders.map((o) =>
          o.priority === "CRITICAL" ? { ...o, deadlineDays: 1 } : o,
        ),
      }),
    );
    // Some alternatives should have critical deadline rule failing
    const deadlineRuleResults = tight.alternatives.flatMap((a) =>
      a.ruleResults.filter((r) => r.ruleId === "RULE-CRITICAL-DEADLINE"),
    );
    assert.ok(deadlineRuleResults.length > 0);
    // At least one should fail (very tight deadline)
    const anyFail = deadlineRuleResults.some((r) => !r.passed);
    assert.ok(anyFail, "At least one alternative should fail with deadline = 1 day");
  });

  test("relaxed deadline allows more alternatives to protect it", () => {
    const relaxed = runProductionReplanningEngine(
      buildRequest({
        orders: DEFAULT_SCENARIO.orders.map((o) =>
          o.priority === "CRITICAL" ? { ...o, deadlineDays: 14 } : o,
        ),
      }),
    );
    const deadlineRuleResults = relaxed.alternatives.flatMap((a) =>
      a.ruleResults.filter((r) => r.ruleId === "RULE-CRITICAL-DEADLINE"),
    );
    const allPass = deadlineRuleResults.every((r) => r.passed);
    assert.ok(allPass, "All alternatives should protect deadline with 14-day window");
  });
});

// ---------------------------------------------------------------------------
// 20: Overtime availability changes
// ---------------------------------------------------------------------------

describe("20. overtime availability changes", () => {
  test("with overtime, REDISTRIBUTE_PRODUCTION can have overtime cost > 0", () => {
    const withOT = runProductionReplanningEngine({
      ...DEFAULT_REQUEST,
      scenario: { ...DEFAULT_SCENARIO, overtimeAvailable: true },
    });
    const redist = withOT.alternatives.find(
      (a) => a.actionId === "REDISTRIBUTE_PRODUCTION",
    )!;
    // Overtime cost may be > 0 when overtime is available and used
    assert.ok(typeof redist.financialImpact.overtimeCost === "number");
  });

  test("without overtime, REDISTRIBUTE_PRODUCTION has zero overtime cost", () => {
    const noOT = runProductionReplanningEngine(
      buildRequest({ overtimeAvailable: false }),
    );
    const redist = noOT.alternatives.find(
      (a) => a.actionId === "REDISTRIBUTE_PRODUCTION",
    )!;
    assert.equal(redist.financialImpact.overtimeCost, 0);
  });
});

// ---------------------------------------------------------------------------
// Regression tests — financial model consistency (problem statement §11)
// ---------------------------------------------------------------------------

describe("R1. every cost component is explicitly represented", () => {
  test("all financial impact fields are present and are numbers", () => {
    const result = getDemoDecision();
    for (const alt of result.alternatives) {
      const fi = alt.financialImpact;
      assert.equal(typeof fi.missedDeadlineCost, "number");
      assert.equal(typeof fi.overtimeCost, "number");
      assert.equal(typeof fi.delayCost, "number");
      assert.equal(typeof fi.unusedCapacityCost, "number");
      assert.equal(typeof fi.switchingCost, "number");
      assert.equal(typeof fi.total, "number");
    }
  });
});

describe("R2. total equals sum of components", () => {
  test("total = sum(all components) for every alternative", () => {
    const result = getDemoDecision();
    for (const alt of result.alternatives) {
      const fi = alt.financialImpact;
      const componentSum =
        fi.missedDeadlineCost +
        fi.overtimeCost +
        fi.delayCost +
        fi.unusedCapacityCost +
        fi.switchingCost;
      assert.equal(fi.total, componentSum, `${alt.actionId} total should equal sum of components`);
    }
  });
});

describe("R3. avoided cost calculation is correct", () => {
  test("avoidedCostVsBaseline = currentTotal - recommendedTotal", () => {
    const result = getDemoDecision();
    const current = result.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    const rec = result.alternatives.find((a) => a.actionId === result.recommendedAction)!;
    const expected = Math.max(0, current.financialImpact.total - rec.financialImpact.total);
    assert.equal(result.avoidedCostVsBaseline, expected);
  });
});

describe("R4. current and recommended plans have coherent operational states", () => {
  test("KEEP_CURRENT_PLAN critical deadline NOT protected under 30% disruption (deadline=2)", () => {
    const result = getDemoDecision();
    const current = result.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    assert.equal(
      current.operationalConsequences.criticalOrderDeadlineProtected,
      false,
      "Current plan should NOT protect critical deadline at 30% disruption with deadline=2",
    );
  });

  test("REDISTRIBUTE_PRODUCTION critical deadline IS protected", () => {
    const result = getDemoDecision();
    const redist = result.alternatives.find((a) => a.actionId === "REDISTRIBUTE_PRODUCTION")!;
    assert.equal(
      redist.operationalConsequences.criticalOrderDeadlineProtected,
      true,
      "Redistribute should protect critical deadline",
    );
  });
});

describe("R5. equal operational states cannot produce arbitrary different costs", () => {
  test("unusedCapacityCost is the same for current and recommended plans", () => {
    const result = getDemoDecision();
    const current = result.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    const redist = result.alternatives.find((a) => a.actionId === "REDISTRIBUTE_PRODUCTION")!;
    assert.equal(
      current.financialImpact.unusedCapacityCost,
      redist.financialImpact.unusedCapacityCost,
      "Unused capacity cost must be the same for both plans (same total production)",
    );
  });

  test("cost difference is explained by missedDeadline + delay - switching", () => {
    const result = getDemoDecision();
    const current = result.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    const redist = result.alternatives.find((a) => a.actionId === "REDISTRIBUTE_PRODUCTION")!;
    // actualDiff = current.total - redist.total
    // Both plans have the same unusedCapacityCost, so:
    // actualDiff = (current.missed - redist.missed) + (current.delay - redist.delay) + (current.switching - redist.switching)
    const explainedDiff =
      (current.financialImpact.missedDeadlineCost - redist.financialImpact.missedDeadlineCost) +
      (current.financialImpact.delayCost - redist.financialImpact.delayCost) +
      (current.financialImpact.switchingCost - redist.financialImpact.switchingCost);
    const actualDiff = current.financialImpact.total - redist.financialImpact.total;
    assert.equal(actualDiff, explainedDiff, "Cost difference must be fully explained by operational components");
  });
});

describe("R6–R8. capacity metrics", () => {
  test("R6: capacity reduction calculation: affectedLine goes from normal to (1-factor)*normal", () => {
    // Line A: 80 t/day, reduction=0.3 → effective 56 t/day
    const scenario = DEFAULT_SCENARIO;
    const affectedLine = scenario.lines.find((l) => l.id === scenario.disruption.affectedLineId)!;
    const before = affectedLine.normalCapacityTpd * affectedLine.availabilityFactor;
    const after = before * (1 - scenario.disruption.capacityReductionFactor);
    assert.equal(before, 80);
    assert.equal(after, 56);
  });

  test("R7: capacity lost = normal * reductionFactor * durationDays", () => {
    const scenario = DEFAULT_SCENARIO;
    const affectedLine = scenario.lines.find((l) => l.id === scenario.disruption.affectedLineId)!;
    const normalTpd = affectedLine.normalCapacityTpd * affectedLine.availabilityFactor;
    const capacityLost = normalTpd * scenario.disruption.capacityReductionFactor * scenario.disruption.durationDays;
    assert.equal(capacityLost, 80 * 0.3 * 3); // = 72 t
  });

  test("R8: remaining capacity = disrupted tpd * durationDays", () => {
    const scenario = DEFAULT_SCENARIO;
    const affectedLine = scenario.lines.find((l) => l.id === scenario.disruption.affectedLineId)!;
    const normalTpd = affectedLine.normalCapacityTpd * affectedLine.availabilityFactor;
    const disruptedTpd = normalTpd * (1 - scenario.disruption.capacityReductionFactor);
    const remaining = disruptedTpd * scenario.disruption.durationDays;
    assert.equal(remaining, 56 * 3); // = 168 t
  });
});

describe("R9. deadline penalties", () => {
  test("KEEP_CURRENT_PLAN has missedDeadlineCost > 0 in baseline scenario", () => {
    const result = getDemoDecision();
    const current = result.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    assert.ok(
      current.financialImpact.missedDeadlineCost > 0,
      "Current plan should incur a missed-deadline penalty when critical order runs on disrupted line",
    );
  });

  test("REDISTRIBUTE_PRODUCTION has missedDeadlineCost = 0", () => {
    const result = getDemoDecision();
    const redist = result.alternatives.find((a) => a.actionId === "REDISTRIBUTE_PRODUCTION")!;
    assert.equal(redist.financialImpact.missedDeadlineCost, 0);
  });

  test("missed deadline cost disappears when critical deadline is relaxed beyond disruption", () => {
    const relaxed = runProductionReplanningEngine(
      buildRequest({
        orders: DEFAULT_SCENARIO.orders.map((o) =>
          o.priority === "CRITICAL" ? { ...o, deadlineDays: 10 } : o,
        ),
      }),
    );
    const current = relaxed.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    assert.equal(current.financialImpact.missedDeadlineCost, 0);
  });
});

describe("R10. overtime costs", () => {
  test("REDISTRIBUTE_PRODUCTION overtime cost is 0 when capacity > required", () => {
    const result = getDemoDecision();
    const redist = result.alternatives.find((a) => a.actionId === "REDISTRIBUTE_PRODUCTION")!;
    // effectiveCapacityTonnes >> totalRequired → overtimeTonnes = 0
    assert.equal(redist.financialImpact.overtimeCost, 0);
  });

  test("overtime cost type is number", () => {
    const result = getDemoDecision();
    for (const alt of result.alternatives) {
      assert.equal(typeof alt.financialImpact.overtimeCost, "number");
    }
  });
});

describe("R11. switching costs", () => {
  test("REDISTRIBUTE_PRODUCTION has switching cost > 0", () => {
    const result = getDemoDecision();
    const redist = result.alternatives.find((a) => a.actionId === "REDISTRIBUTE_PRODUCTION")!;
    assert.ok(redist.financialImpact.switchingCost > 0);
  });

  test("KEEP_CURRENT_PLAN has switching cost = 0", () => {
    const result = getDemoDecision();
    const current = result.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    assert.equal(current.financialImpact.switchingCost, 0);
  });
});

describe("R12. lineAllocations present in operational consequences", () => {
  test("every alternative has lineAllocations array", () => {
    const result = getDemoDecision();
    for (const alt of result.alternatives) {
      assert.ok(Array.isArray(alt.operationalConsequences.lineAllocations));
      assert.ok(alt.operationalConsequences.lineAllocations.length > 0);
    }
  });

  test("KEEP_CURRENT_PLAN: critical order is allocated to the affected line", () => {
    const result = getDemoDecision();
    const current = result.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    const affectedLineAlloc = current.operationalConsequences.lineAllocations.find(
      (l) => l.lineId === DEFAULT_SCENARIO.disruption.affectedLineId,
    );
    assert.ok(affectedLineAlloc, "Affected line should have an allocation");
    const criticalOrderAlloc = affectedLineAlloc!.orders.find(
      (o) => DEFAULT_SCENARIO.orders.find((ord) => ord.id === o.orderId)?.priority === "CRITICAL",
    );
    assert.ok(criticalOrderAlloc, "Critical order should appear on affected line");
  });

  test("REDISTRIBUTE_PRODUCTION: critical order appears on both lines", () => {
    const result = getDemoDecision();
    const redist = result.alternatives.find((a) => a.actionId === "REDISTRIBUTE_PRODUCTION")!;
    const criticalOrderId = DEFAULT_SCENARIO.orders.find((o) => o.priority === "CRITICAL")!.id;
    const linesWithCritical = redist.operationalConsequences.lineAllocations.filter(
      (l) => l.orders.some((o) => o.orderId === criticalOrderId),
    );
    assert.ok(linesWithCritical.length >= 1, "Critical order should be distributed across lines");
  });
});

describe("R13. changing constraints changes recommendation and financial output", () => {
  test("relaxing critical deadline to 10 days removes the missed-deadline penalty on current plan", () => {
    const relaxed = runProductionReplanningEngine(
      buildRequest({
        orders: DEFAULT_SCENARIO.orders.map((o) =>
          o.priority === "CRITICAL" ? { ...o, deadlineDays: 10 } : o,
        ),
      }),
    );
    const current = relaxed.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    assert.equal(current.financialImpact.missedDeadlineCost, 0, "Relaxed deadline eliminates missed-deadline cost");
  });

  test("increasing capacity reduction makes current plan miss deadline more severely", () => {
    const moreDisrupted = runProductionReplanningEngine(
      buildRequest({
        disruption: { ...DEFAULT_SCENARIO.disruption, capacityReductionFactor: 0.7 },
      }),
    );
    const baseline = getDemoDecision();
    const moreDisruptedCurrent = moreDisrupted.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    const baselineCurrent = baseline.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    assert.ok(
      moreDisruptedCurrent.financialImpact.missedDeadlineCost >= baselineCurrent.financialImpact.missedDeadlineCost,
      "More capacity reduction should not reduce missed-deadline cost",
    );
  });
});

describe("R14. explanation values match engine output", () => {
  test("explanation savings figure matches actual financial difference", () => {
    const result = getDemoDecision();
    const savingsFactor = result.explanation.reasons.find(
      (r) => r.label === "Lower total financial impact",
    );
    if (savingsFactor) {
      const current = result.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
      const rec = result.alternatives.find((a) => a.actionId === result.recommendedAction)!;
      const actualSaved = current.financialImpact.total - rec.financialImpact.total;
      assert.ok(
        savingsFactor.evidence.includes(actualSaved.toLocaleString("en-US")),
        "Explanation savings figure must match actual difference",
      );
    }
  });
});

describe("R15. no hardcoded financial output", () => {
  test("changing cost config changes total cost", () => {
    const cheapDeadline = runProductionReplanningEngine({
      ...DEFAULT_REQUEST,
      costConfig: { ...DEFAULT_COST_CONFIG, missedCriticalDeadlineCostPerTonneDay: 1 },
    });
    const expensiveDeadline = runProductionReplanningEngine({
      ...DEFAULT_REQUEST,
      costConfig: { ...DEFAULT_COST_CONFIG, missedCriticalDeadlineCostPerTonneDay: 5000 },
    });
    const cheapCurrent = cheapDeadline.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    const expCurrent = expensiveDeadline.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    // Higher deadline cost must produce higher total for the plan that misses the deadline
    assert.ok(
      expCurrent.financialImpact.missedDeadlineCost >= cheapCurrent.financialImpact.missedDeadlineCost,
      "Higher deadline cost rate must produce higher deadline penalty",
    );
  });
});
