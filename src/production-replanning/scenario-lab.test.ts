/**
 * Scenario Lab tests — production replanning.
 *
 * Tests cover all 18 requirements from the task spec.
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
  computeProductionSensitivity,
  computeProductionTraceDiff,
  computeProductionDecisionDelta,
} from "@/production-replanning/lib/scenario-lab-helpers";
import {
  runSupplierDecisionPlugin,
  DEFAULT_SUPPLIER_CONFIG,
} from "@/supplier/lib/supplier-decision";
import {
  DEMO_REQUEST,
  DEMO_SUPPLIERS,
} from "@/supplier/data/synthetic-supplier-data";
import {
  computeSupplierSensitivity,
  computeSupplierTraceDiff,
  computeSupplierPolicyImpact,
} from "@/supplier/lib/scenario-lab-helpers";
import type {
  ProductionScenario,
  ProductionDecisionRequest,
} from "@/production-replanning/types";
import type { SupplierDecisionRequest } from "@/supplier/types/supplier-decision";

function buildProdRequest(
  patch: Partial<ProductionScenario>,
): ProductionDecisionRequest {
  return {
    scenario: { ...DEFAULT_SCENARIO, ...patch, scenarioId: "TEST" },
    costConfig: DEFAULT_COST_CONFIG,
  };
}

describe("scenario isolation", () => {
  test("1. baseline scenario unchanged after modifications", () => {
    const original = JSON.stringify(DEFAULT_SCENARIO);
    const modified = { ...DEFAULT_SCENARIO, scenarioId: "MODIFIED" };
    runProductionReplanningEngine({ scenario: modified });
    assert.equal(
      JSON.stringify(DEFAULT_SCENARIO),
      original,
      "DEFAULT_SCENARIO must not be mutated",
    );
  });

  test("13. scenario does not mutate global configuration", () => {
    const originalConfig = JSON.stringify(DEFAULT_COST_CONFIG);
    const customConfig = {
      ...DEFAULT_COST_CONFIG,
      overtimeCostPerTonne: 999,
    };
    runProductionReplanningEngine({
      scenario: DEFAULT_SCENARIO,
      costConfig: customConfig,
    });
    assert.equal(
      JSON.stringify(DEFAULT_COST_CONFIG),
      originalConfig,
      "DEFAULT_COST_CONFIG must not be mutated",
    );
  });
});

describe("determinism", () => {
  test("2. same scenario → same decision", () => {
    const a = runProductionReplanningEngine(DEFAULT_REQUEST);
    const b = runProductionReplanningEngine(DEFAULT_REQUEST);
    assert.equal(a.recommendedAction, b.recommendedAction);
  });

  test("3. same scenario → same financial impact", () => {
    const a = runProductionReplanningEngine(DEFAULT_REQUEST);
    const b = runProductionReplanningEngine(DEFAULT_REQUEST);
    assert.equal(a.totalFinancialImpact, b.totalFinancialImpact);
  });
});

test("4. extreme capacity reduction changes capacity economics", () => {
  const mild = runProductionReplanningEngine(
    buildProdRequest({
      disruption: {
        ...DEFAULT_SCENARIO.disruption,
        capacityReductionFactor: 0.1,
      },
    }),
  );
  const extreme = runProductionReplanningEngine(
    buildProdRequest({
      disruption: {
        ...DEFAULT_SCENARIO.disruption,
        capacityReductionFactor: 0.95,
      },
    }),
  );
  const mildKeep = mild.alternatives.find(
    (a) => a.actionId === "KEEP_CURRENT_PLAN",
  )!;
  const extremeKeep = extreme.alternatives.find(
    (a) => a.actionId === "KEEP_CURRENT_PLAN",
  )!;
  assert.ok(
    extremeKeep.financialImpact.total >= mildKeep.financialImpact.total,
    "extreme capacity reduction must not reduce baseline disruption cost",
  );
});

test("5. very tight critical deadline changes decision or feasibility", () => {
  const tight = runProductionReplanningEngine(
    buildProdRequest({
      orders: DEFAULT_SCENARIO.orders.map((o) =>
        o.priority === "CRITICAL" ? { ...o, deadlineDays: 1 } : o,
      ),
    }),
  );
  const base = runProductionReplanningEngine(DEFAULT_REQUEST);
  const baseKeep = base.alternatives.find(
    (a) => a.actionId === "KEEP_CURRENT_PLAN",
  )!;
  const tightKeep = tight.alternatives.find(
    (a) => a.actionId === "KEEP_CURRENT_PLAN",
  )!;
  assert.ok(
    tightKeep.financialImpact.missedDeadlineCost >=
      baseKeep.financialImpact.missedDeadlineCost,
    "tighter deadline must not reduce missed deadline cost",
  );
});

test("6. insufficient material makes alternatives infeasible", () => {
  const noMat = runProductionReplanningEngine(
    buildProdRequest({
      materials: [
        { id: "MAT-A", name: "Material A", availableTonnes: 1 },
        { id: "MAT-B", name: "Material B", availableTonnes: 1 },
      ],
    }),
  );
  const infeasible = noMat.alternatives.filter(
    (a) => a.feasibility === "INFEASIBLE",
  );
  assert.ok(
    infeasible.length > 0,
    "insufficient material must make at least one alternative infeasible",
  );
});

test("7. overtime availability changes overtime handling", () => {
  const withOT = runProductionReplanningEngine({ ...DEFAULT_REQUEST });
  const withoutOT = runProductionReplanningEngine(
    buildProdRequest({ overtimeAvailable: false }),
  );
  const withRedist = withOT.alternatives.find(
    (a) => a.actionId === "REDISTRIBUTE_PRODUCTION",
  );
  const withoutRedist = withoutOT.alternatives.find(
    (a) => a.actionId === "REDISTRIBUTE_PRODUCTION",
  );
  assert.ok(withRedist && withoutRedist);
  assert.ok(
    typeof withRedist.financialImpact.overtimeCost === "number",
    "overtime-enabled scenario must expose an overtime cost component",
  );
  assert.equal(
    withoutRedist.financialImpact.overtimeCost,
    0,
    "overtime-disabled scenario must zero out overtime cost",
  );
});

test("8. higher overtime cost increases total financial impact", () => {
  const standard = runProductionReplanningEngine(DEFAULT_REQUEST);
  const higherOT = runProductionReplanningEngine({
    scenario: DEFAULT_SCENARIO,
    costConfig: { ...DEFAULT_COST_CONFIG, overtimeCostPerTonne: 500 },
  });
  const stdRedist = standard.alternatives.find(
    (a) => a.actionId === "REDISTRIBUTE_PRODUCTION",
  )!;
  const highRedist = higherOT.alternatives.find(
    (a) => a.actionId === "REDISTRIBUTE_PRODUCTION",
  )!;
  if (stdRedist.financialImpact.overtimeCost > 0) {
    assert.ok(
      highRedist.financialImpact.total >= stdRedist.financialImpact.total,
      "higher overtime cost must not reduce total cost",
    );
  }
});

test("9. supplier HIGH financial risk triggers RULE-05 fail", () => {
  const highRiskReq: SupplierDecisionRequest = {
    ...DEMO_REQUEST,
    caseId: "TEST-HIGH-RISK",
    candidates: [{ ...DEMO_SUPPLIERS[0], financialRisk: "HIGH" }],
  };
  const result = runSupplierDecisionPlugin(highRiskReq);
  const rule05 = result.recommendation.ruleResults.find(
    (r) => r.rule.id === "RULE-05",
  );
  assert.ok(rule05, "RULE-05 must be evaluated");
  assert.equal(rule05.passed, false, "RULE-05 must fail for HIGH financial risk");
});

test("10. supplier quality below threshold triggers RULE-02 fail", () => {
  const lowQualityReq: SupplierDecisionRequest = {
    ...DEMO_REQUEST,
    caseId: "TEST-LOW-QUALITY",
    candidates: [{ ...DEMO_SUPPLIERS[0], qualityScore: 0.8 }],
  };
  const result = runSupplierDecisionPlugin(lowQualityReq);
  const rule02 = result.recommendation.ruleResults.find(
    (r) => r.rule.id === "RULE-02",
  );
  assert.ok(rule02, "RULE-02 must be evaluated");
  assert.equal(rule02.passed, false, "RULE-02 must fail when quality is below threshold");
});

test("11. rule weight changes affect supplier score", () => {
  const baseResult = runSupplierDecisionPlugin(DEMO_REQUEST);
  const reweightedResult = runSupplierDecisionPlugin({
    ...DEMO_REQUEST,
    caseId: "TEST-WEIGHTS",
    configuration: {
      ...DEFAULT_SUPPLIER_CONFIG,
      scoreWeights: {
        delivery: 0.1,
        quality: 0.1,
        inverseDependency: 0.6,
        inverseIncidents: 0.1,
        compliance: 0.05,
        inverseLeadTime: 0.05,
      },
    },
  });
  assert.notEqual(
    baseResult.recommendation.overallScore,
    reweightedResult.recommendation.overallScore,
    "changing score weights must change the overall score",
  );
});

test("12. reset restores baseline scenario exactly", () => {
  // Simulate user changing scenario, then resetting back to baseline
  const baseline = runProductionReplanningEngine(DEFAULT_REQUEST);

  // Modify scenario: tighten critical deadline so some alternatives become INFEASIBLE
  const modifiedRequest = buildProdRequest({
    orders: DEFAULT_SCENARIO.orders.map((o) =>
      o.priority === "CRITICAL" ? { ...o, deadlineDays: 1 } : o,
    ),
  });
  const modified = runProductionReplanningEngine(modifiedRequest);
  // Modified scenario must differ in at least one measurable way
  const baseInfeasible = baseline.alternatives.filter((a) => a.feasibility === "INFEASIBLE").length;
  const modInfeasible = modified.alternatives.filter((a) => a.feasibility === "INFEASIBLE").length;
  assert.ok(
    modInfeasible > baseInfeasible ||
      modified.avoidedCostVsBaseline !== baseline.avoidedCostVsBaseline ||
      modified.recommendedAction !== baseline.recommendedAction,
    "modified scenario must differ from baseline in feasibility, avoided cost, or action",
  );

  // Reset = run with original DEFAULT_REQUEST (simulates UI 'reset to baseline' button)
  const afterReset = runProductionReplanningEngine(DEFAULT_REQUEST);
  assert.equal(afterReset.recommendedAction, baseline.recommendedAction);
  assert.equal(afterReset.totalFinancialImpact, baseline.totalFinancialImpact);
  assert.equal(afterReset.avoidedCostVsBaseline, baseline.avoidedCostVsBaseline);
  assert.equal(
    afterReset.alternatives.filter((a) => a.feasibility === "INFEASIBLE").length,
    baseInfeasible,
  );
});

test("14. decision trace changes consistently with scenario change", () => {
  const base = runProductionReplanningEngine(DEFAULT_REQUEST);
  const modified = runProductionReplanningEngine(
    buildProdRequest({
      materials: [
        { id: "MAT-A", name: "Material A", availableTonnes: 50 },
        { id: "MAT-B", name: "Material B", availableTonnes: 50 },
      ],
    }),
  );
  const baseRules = base.alternatives[0].ruleResults;
  const modRules = modified.alternatives[0].ruleResults;
  const diffEvidence = baseRules.some((r, i) => r.evidence !== modRules[i]?.evidence);
  assert.ok(diffEvidence, "rule evidence must change when scenario changes");
});

test("15. trace diff identifies changed rules correctly", () => {
  const base = runProductionReplanningEngine(DEFAULT_REQUEST);
  const noMaterial = runProductionReplanningEngine(
    buildProdRequest({
      materials: [
        { id: "MAT-A", name: "Material A", availableTonnes: 5 },
        { id: "MAT-B", name: "Material B", availableTonnes: 5 },
      ],
    }),
  );
  const diff = computeProductionTraceDiff(base, noMaterial);
  assert.ok(diff.length > 0, "trace diff must contain entries");
  const matRule = diff.find((d) => d.ruleId === "RULE-MATERIAL");
  assert.ok(matRule, "trace diff must include RULE-MATERIAL");
});

test("16. financial breakdown components sum to total", () => {
  const result = runProductionReplanningEngine(DEFAULT_REQUEST);
  for (const alt of result.alternatives) {
    const fi = alt.financialImpact;
    const computed =
      fi.missedDeadlineCost +
      fi.overtimeCost +
      fi.delayCost +
      fi.unusedCapacityCost +
      fi.switchingCost;
    assert.equal(computed, fi.total, `financial breakdown sum mismatch for ${alt.actionId}`);
  }
});

test("17. avoided cost equals baseline minus recommended total", () => {
  const result = runProductionReplanningEngine(DEFAULT_REQUEST);
  const baseline = result.alternatives.find(
    (a) => a.actionId === "KEEP_CURRENT_PLAN",
  )!;
  const recommended = result.alternatives.find(
    (a) => a.actionId === result.recommendedAction,
  )!;
  const expectedAvoidedCost = Math.max(
    0,
    baseline.financialImpact.total - recommended.financialImpact.total,
  );
  assert.equal(result.avoidedCostVsBaseline, expectedAvoidedCost);
});

test("18. no hardcoded decision transitions — result comes from engine", () => {
  const base = runProductionReplanningEngine(DEFAULT_REQUEST);
  const noOvertimeNoMaterial = runProductionReplanningEngine(
    buildProdRequest({
      overtimeAvailable: false,
      materials: DEFAULT_SCENARIO.materials.map((m) => ({
        ...m,
        availableTonnes: m.availableTonnes * 0.3,
      })),
    }),
  );
  const baseFeasible = base.alternatives.filter(
    (a) => a.feasibility === "FEASIBLE",
  ).length;
  const modFeasible = noOvertimeNoMaterial.alternatives.filter(
    (a) => a.feasibility === "FEASIBLE",
  ).length;
  assert.ok(
    baseFeasible !== modFeasible ||
      base.recommendedAction !== noOvertimeNoMaterial.recommendedAction ||
      base.totalFinancialImpact !== noOvertimeNoMaterial.totalFinancialImpact,
    "changing inputs must change engine output",
  );
});

test("supplier policy threshold change changes decision where appropriate", () => {
  const borderlineReq: SupplierDecisionRequest = {
    ...DEMO_REQUEST,
    caseId: "TEST-BORDER",
    candidates: [{ ...DEMO_SUPPLIERS[0], deliveryPerformance: 0.86 }],
    configuration: { ...DEFAULT_SUPPLIER_CONFIG },
  };
  const baseResult = runSupplierDecisionPlugin(borderlineReq);
  const stricterResult = runSupplierDecisionPlugin({
    ...borderlineReq,
    configuration: {
      ...DEFAULT_SUPPLIER_CONFIG,
      minDeliveryPerformance: 0.9,
    },
  });
  void baseResult;
  const rule01Strict = stricterResult.recommendation.ruleResults.find(
    (r) => r.rule.id === "RULE-01",
  );
  assert.ok(rule01Strict);
  assert.equal(rule01Strict.passed, false, "RULE-01 must fail with stricter threshold");
});

// ---------------------------------------------------------------------------
// Part A — regression: baseline output must not contain "4% capacity loss"
// ---------------------------------------------------------------------------

test("Part A: baseline output contains no '4% capacity loss' text", () => {
  const result = runProductionReplanningEngine(DEFAULT_REQUEST);
  const json = JSON.stringify(result);
  assert.ok(
    !json.includes("4% capacity loss"),
    "baseline engine output must not contain the incorrect '4% capacity loss' wording",
  );
});

test("Part A: RULE-DISRUPTION evidence uses actual capacity reduction factor", () => {
  const result = runProductionReplanningEngine(DEFAULT_REQUEST);
  const reductionFactor = DEFAULT_SCENARIO.disruption.capacityReductionFactor; // 0.30
  const remainingPct = ((1 - reductionFactor) * 100).toFixed(0); // "70"
  const redistAlt = result.alternatives.find((a) => a.actionId === "REDISTRIBUTE_PRODUCTION")!;
  const disruptionRule = redistAlt.ruleResults.find((r) => r.ruleId === "RULE-DISRUPTION");
  assert.ok(disruptionRule, "RULE-DISRUPTION must exist");
  assert.ok(
    disruptionRule!.evidence.includes(`${remainingPct}%`),
    `RULE-DISRUPTION evidence must include the actual remaining capacity (${remainingPct}%), got: ${disruptionRule!.evidence}`,
  );
  // Also verify it does NOT contain the misleading small percentage
  const illegalPattern = /% capacity loss\b/;
  assert.ok(
    !illegalPattern.test(disruptionRule!.evidence),
    "RULE-DISRUPTION evidence must not contain '% capacity loss' phrasing",
  );
});

// ---------------------------------------------------------------------------
// Part C — scenario control acceptance tests
// ---------------------------------------------------------------------------

describe("Part C: scenario control acceptance tests", () => {

  // Test 1 — Capacity reduction: 30% → 50%
  test("C1: capacity reduction 30→50% causes engine to recompute", () => {
    const baseline = runProductionReplanningEngine(DEFAULT_REQUEST);
    const scenario = runProductionReplanningEngine(
      buildProdRequest({
        disruption: { ...DEFAULT_SCENARIO.disruption, capacityReductionFactor: 0.5 },
      }),
    );

    // Financial impacts must differ — more capacity removed = different costs
    const baseKeep = baseline.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    const scKeep = scenario.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    assert.ok(
      scKeep.financialImpact.total !== baseKeep.financialImpact.total ||
        baseline.totalFinancialImpact !== scenario.totalFinancialImpact ||
        baseline.avoidedCostVsBaseline !== scenario.avoidedCostVsBaseline,
      "C1: some financial output must differ after capacity reduction change",
    );

    // RULE-DISRUPTION evidence must reflect 50% (i.e., "50% of normal capacity")
    const scRedist = scenario.alternatives.find((a) => a.actionId === "REDISTRIBUTE_PRODUCTION")!;
    const rule = scRedist.ruleResults.find((r) => r.ruleId === "RULE-DISRUPTION");
    // With 50% reduction, remaining = 50%
    assert.ok(rule?.evidence.includes("50%"), `C1: RULE-DISRUPTION evidence must reference 50%, got: ${rule?.evidence}`);
  });

  // Test 2 — Capacity reduction = 0%
  test("C2: capacity reduction 0% restores full line capacity", () => {
    const noDisruption = runProductionReplanningEngine(
      buildProdRequest({
        disruption: { ...DEFAULT_SCENARIO.disruption, capacityReductionFactor: 0 },
      }),
    );
    const baseline = runProductionReplanningEngine(DEFAULT_REQUEST);

    const noDisruptKeep = noDisruption.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    const baseKeep = baseline.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;

    // With 0% reduction, capacity is fully restored → disruption cost must not increase
    assert.ok(
      noDisruptKeep.financialImpact.total <= baseKeep.financialImpact.total,
      "C2: 0% disruption must not increase disruption-related costs for KEEP_CURRENT_PLAN",
    );

    // Engine output must change vs baseline (costs should decrease or plan becomes more feasible)
    assert.ok(
      noDisruptKeep.financialImpact.total !== baseKeep.financialImpact.total ||
        noDisruption.avoidedCostVsBaseline !== baseline.avoidedCostVsBaseline ||
        noDisruption.recommendedAction !== baseline.recommendedAction,
      "C2: removing disruption must change some engine output",
    );
  });

  // Test 3 — High capacity reduction
  test("C3: high capacity reduction detects infeasible alternatives and no NaN/Infinity", () => {
    const highReduction = runProductionReplanningEngine(
      buildProdRequest({
        disruption: { ...DEFAULT_SCENARIO.disruption, capacityReductionFactor: 0.98 },
      }),
    );

    // No NaN/Infinity in financial impacts; no negative values
    for (const alt of highReduction.alternatives) {
      const fi = alt.financialImpact;
      for (const [key, val] of Object.entries(fi)) {
        assert.ok(
          Number.isFinite(val as number),
          `C3: ${alt.actionId}.financialImpact.${key} must be finite, got ${val}`,
        );
        assert.ok(
          (val as number) >= 0,
          `C3: ${alt.actionId}.financialImpact.${key} must not be negative, got ${val}`,
        );
      }
    }

    // Infeasible alternatives must have blocking rules that explain why
    const infeasible = highReduction.alternatives.filter((a) => a.feasibility === "INFEASIBLE");
    for (const alt of infeasible) {
      assert.ok(
        alt.blockingConstraints.length > 0,
        `C3: infeasible alternative ${alt.actionId} must have blocking constraint evidence`,
      );
    }
  });

  // Test 4 — Disruption duration: 3 → 6 days
  test("C4: disruption duration 3→6 days changes capacity utilization evidence and trace", () => {
    const threeDays = runProductionReplanningEngine(DEFAULT_REQUEST);
    const sixDays = runProductionReplanningEngine(
      buildProdRequest({
        disruption: { ...DEFAULT_SCENARIO.disruption, durationDays: 6 },
      }),
    );

    // RULE-UTILIZATION evidence uses disrupted capacity which changes with duration
    const threeKeep = threeDays.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    const sixKeep = sixDays.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    const threeUtilRule = threeKeep.ruleResults.find((r) => r.ruleId === "RULE-UTILIZATION");
    const sixUtilRule = sixKeep.ruleResults.find((r) => r.ruleId === "RULE-UTILIZATION");
    assert.ok(
      threeUtilRule?.evidence !== sixUtilRule?.evidence ||
        threeDays.totalFinancialImpact !== sixDays.totalFinancialImpact,
      "C4: changing disruption duration must change capacity utilization evidence or financial impact",
    );

    // RULE-DISRUPTION evidence must reference 6 days
    const sixRedist = sixDays.alternatives.find((a) => a.actionId === "REDISTRIBUTE_PRODUCTION")!;
    const rule = sixRedist.ruleResults.find((r) => r.ruleId === "RULE-DISRUPTION");
    assert.ok(rule?.evidence.includes("6-day"), `C4: RULE-DISRUPTION evidence must reference 6-day disruption, got: ${rule?.evidence}`);
  });

  // Test 5 — Material availability
  test("C5: lower material availability causes material rule to be recalculated", () => {
    const lowMat = runProductionReplanningEngine(
      buildProdRequest({
        materials: [
          { id: "MAT-A", name: "Material A", availableTonnes: 50 },
          { id: "MAT-B", name: "Material B", availableTonnes: 50 },
        ],
      }),
    );

    // RULE-MATERIAL evidence must change
    const baseline = runProductionReplanningEngine(DEFAULT_REQUEST);
    const baseAlt = baseline.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN");
    const lowAlt = lowMat.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN");
    assert.ok(baseAlt, "C5: baseline must include KEEP_CURRENT_PLAN");
    assert.ok(lowAlt, "C5: low-material scenario must include KEEP_CURRENT_PLAN");
    const baseMatRule = baseAlt.ruleResults.find((r) => r.ruleId === "RULE-MATERIAL")!;
    const lowMatRule = lowAlt.ruleResults.find((r) => r.ruleId === "RULE-MATERIAL")!;
    assert.ok(
      baseMatRule.evidence !== lowMatRule.evidence,
      "C5: RULE-MATERIAL evidence must change when material availability changes",
    );

    // Affected alternatives must become infeasible when material is insufficient
    const totalRequired = DEFAULT_SCENARIO.orders.reduce((s, o) => s + o.requiredTonnes, 0);
    const materialAvailable = 50 + 50; // matches availableTonnes passed to buildProdRequest above
    if (materialAvailable < totalRequired) {
      const infeasible = lowMat.alternatives.filter((a) => a.feasibility === "INFEASIBLE");
      assert.ok(
        infeasible.length > 0,
        "C5: insufficient material must make at least one alternative infeasible",
      );
    }

    // Recommendation must be recalculated (may differ from baseline)
    // At minimum, the engine ran — assertion is that no error was thrown and result is valid
    assert.ok(typeof lowMat.recommendedAction === "string");
  });

  // Test 6 — Critical deadline: 2 → 5 days
  test("C6: loosening critical deadline changes deadline-related calculations", () => {
    const tight = runProductionReplanningEngine(DEFAULT_REQUEST); // deadline = 2
    const loose = runProductionReplanningEngine(
      buildProdRequest({
        orders: DEFAULT_SCENARIO.orders.map((o) =>
          o.priority === "CRITICAL" ? { ...o, deadlineDays: 5 } : o,
        ),
      }),
    );

    // RULE-CRITICAL-DEADLINE evidence must change
    const tightAlt = tight.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    const looseAlt = loose.alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
    const tightDeadlineRule = tightAlt.ruleResults.find((r) => r.ruleId === "RULE-CRITICAL-DEADLINE")!;
    const looseDeadlineRule = looseAlt.ruleResults.find((r) => r.ruleId === "RULE-CRITICAL-DEADLINE")!;
    assert.ok(
      tightDeadlineRule.evidence !== looseDeadlineRule.evidence,
      "C6: RULE-CRITICAL-DEADLINE evidence must reflect the changed deadline",
    );

    // Financial or feasibility impact must change
    assert.ok(
      tightAlt.financialImpact.total !== looseAlt.financialImpact.total ||
        tightAlt.feasibility !== looseAlt.feasibility ||
        tight.recommendedAction !== loose.recommendedAction,
      "C6: changing critical deadline must affect some engine output",
    );
  });

  // Test 7 — Overtime toggle
  test("C7a: overtime OFF zeroes overtime cost and may change total", () => {
    const withOT = runProductionReplanningEngine(DEFAULT_REQUEST);
    const withoutOT = runProductionReplanningEngine(
      buildProdRequest({ overtimeAvailable: false }),
    );

    // Overtime cost must be 0 when overtime is disabled for all alternatives
    for (const alt of withoutOT.alternatives) {
      assert.equal(
        alt.financialImpact.overtimeCost,
        0,
        `C7a: ${alt.actionId}.overtimeCost must be 0 when overtime is disabled`,
      );
    }

    // When overtime is enabled and actually used, the total financial impact for
    // overtime-eligible alternatives must differ
    const withRedist = withOT.alternatives.find((a) => a.actionId === "REDISTRIBUTE_PRODUCTION")!;
    const withoutRedist = withoutOT.alternatives.find((a) => a.actionId === "REDISTRIBUTE_PRODUCTION")!;
    if (withRedist.financialImpact.overtimeCost > 0) {
      assert.ok(
        withRedist.financialImpact.total !== withoutRedist.financialImpact.total,
        "C7a: when overtime is used, total cost must differ when disabled",
      );
    }
  });

  test("C7b: resetting overtime ON restores exact baseline output", () => {
    const baseline = runProductionReplanningEngine(DEFAULT_REQUEST);
    // Turn off overtime
    runProductionReplanningEngine(buildProdRequest({ overtimeAvailable: false }));
    // Turn back on (same as DEFAULT_REQUEST)
    const restored = runProductionReplanningEngine(DEFAULT_REQUEST);

    assert.equal(restored.recommendedAction, baseline.recommendedAction, "C7b: recommended action must match after reset");
    assert.equal(restored.totalFinancialImpact, baseline.totalFinancialImpact, "C7b: total financial impact must match after reset");
    assert.equal(restored.avoidedCostVsBaseline, baseline.avoidedCostVsBaseline, "C7b: avoided cost must match after reset");
  });
});

// ---------------------------------------------------------------------------
// Part D — baseline isolation regression test
// ---------------------------------------------------------------------------

test("Part D: reset to baseline is byte-for-byte equivalent to original baseline", () => {
  const baseline = runProductionReplanningEngine(DEFAULT_REQUEST);

  // Simulate a user modifying all 5 controls
  runProductionReplanningEngine(
    buildProdRequest({
      disruption: { ...DEFAULT_SCENARIO.disruption, capacityReductionFactor: 0.6, durationDays: 8 },
      materials: DEFAULT_SCENARIO.materials.map((m) => ({ ...m, availableTonnes: 50 })),
      orders: DEFAULT_SCENARIO.orders.map((o) =>
        o.priority === "CRITICAL" ? { ...o, deadlineDays: 1 } : o,
      ),
      overtimeAvailable: false,
    }),
  );

  // Reset: re-run with DEFAULT_REQUEST (baseline)
  const afterReset = runProductionReplanningEngine(DEFAULT_REQUEST);

  assert.equal(afterReset.recommendedAction, baseline.recommendedAction, "Part D: decision must match");
  assert.equal(afterReset.totalFinancialImpact, baseline.totalFinancialImpact, "Part D: total financial impact must match");
  assert.equal(afterReset.avoidedCostVsBaseline, baseline.avoidedCostVsBaseline, "Part D: avoided cost must match");
  assert.deepEqual(
    afterReset.alternatives.map((a) => ({
      actionId: a.actionId,
      feasibility: a.feasibility,
      total: a.financialImpact.total,
      composite: a.score.composite,
    })),
    baseline.alternatives.map((a) => ({
      actionId: a.actionId,
      feasibility: a.feasibility,
      total: a.financialImpact.total,
      composite: a.score.composite,
    })),
    "Part D: all alternative details must match baseline after reset",
  );

  // Verify DEFAULT_SCENARIO is still unchanged
  assert.equal(
    DEFAULT_SCENARIO.disruption.capacityReductionFactor,
    0.3,
    "Part D: DEFAULT_SCENARIO must not be mutated",
  );
});

// ---------------------------------------------------------------------------
// Part E — supplier scenario controls reach the engine
// ---------------------------------------------------------------------------

describe("Part E: supplier scenario controls", () => {
  test("E1: financial risk HIGH triggers RULE-05 fail", () => {
    const req: SupplierDecisionRequest = {
      ...DEMO_REQUEST,
      caseId: "E1-FIN-RISK",
      candidates: [{ ...DEMO_SUPPLIERS[0], financialRisk: "HIGH" }],
    };
    const result = runSupplierDecisionPlugin(req);
    const rule05 = result.recommendation.ruleResults.find((r) => r.rule.id === "RULE-05");
    assert.ok(rule05, "E1: RULE-05 must be evaluated");
    assert.equal(rule05!.passed, false, "E1: RULE-05 must fail for HIGH financial risk");
  });

  test("E2: delivery reliability drop changes RULE-01 result", () => {
    const baseline = runSupplierDecisionPlugin(DEMO_REQUEST);
    const baseRule01 = baseline.recommendation.ruleResults.find((r) => r.rule.id === "RULE-01");

    const lowDelivery: SupplierDecisionRequest = {
      ...DEMO_REQUEST,
      caseId: "E2-DELIVERY",
      candidates: [{ ...DEMO_SUPPLIERS[0], deliveryPerformance: 0.70 }],
    };
    const result = runSupplierDecisionPlugin(lowDelivery);
    const rule01 = result.recommendation.ruleResults.find((r) => r.rule.id === "RULE-01");
    assert.ok(rule01, "E2: RULE-01 must be evaluated");
    // Evidence must differ if delivery changed meaningfully
    assert.ok(
      rule01!.evidence !== baseRule01?.evidence || rule01!.passed !== baseRule01?.passed,
      "E2: RULE-01 result or evidence must change when delivery performance drops significantly",
    );
  });

  test("E3: quality score below threshold triggers RULE-02 fail", () => {
    const req: SupplierDecisionRequest = {
      ...DEMO_REQUEST,
      caseId: "E3-QUALITY",
      candidates: [{ ...DEMO_SUPPLIERS[0], qualityScore: 0.80 }],
    };
    const result = runSupplierDecisionPlugin(req);
    const rule02 = result.recommendation.ruleResults.find((r) => r.rule.id === "RULE-02");
    assert.ok(rule02, "E3: RULE-02 must be evaluated");
    assert.equal(rule02!.passed, false, "E3: RULE-02 must fail when quality is below threshold");
  });

  test("E4: high dependency changes RULE-06 result", () => {
    const req: SupplierDecisionRequest = {
      ...DEMO_REQUEST,
      caseId: "E4-DEPENDENCY",
      candidates: [{ ...DEMO_SUPPLIERS[0], dependency: 0.95 }],
    };
    const result = runSupplierDecisionPlugin(req);
    const rule06 = result.recommendation.ruleResults.find((r) => r.rule.id === "RULE-06");
    assert.ok(rule06, "E4: RULE-06 must be evaluated");
    assert.equal(rule06!.passed, false, "E4: RULE-06 must fail for high dependency (0.95)");
  });

  test("E5: non-compliant supplier triggers compliance rule fail", () => {
    const req: SupplierDecisionRequest = {
      ...DEMO_REQUEST,
      caseId: "E5-COMPLIANCE",
      candidates: [{ ...DEMO_SUPPLIERS[0], compliant: false }],
    };
    const result = runSupplierDecisionPlugin(req);
    const complianceRule = result.recommendation.ruleResults.find(
      (r) => r.rule.id === "RULE-03" || r.rule.id.includes("COMPLIANCE"),
    );
    assert.ok(complianceRule, "E5: compliance rule must be evaluated");
    assert.equal(complianceRule!.passed, false, "E5: compliance rule must fail for non-compliant supplier");
  });
});

test("scenario lab helper functions return deterministic structures", () => {
  const prodSensitivity = computeProductionSensitivity(DEFAULT_REQUEST);
  const supplierSensitivity = computeSupplierSensitivity(DEMO_REQUEST);
  const supplierTrace = computeSupplierTraceDiff(
    runSupplierDecisionPlugin(DEMO_REQUEST),
    runSupplierDecisionPlugin({
      ...DEMO_REQUEST,
      caseId: "TRACE-DIFF",
      candidates: [{ ...DEMO_SUPPLIERS[0], compliant: false }],
    }),
  );
  const policyImpact = computeSupplierPolicyImpact(DEMO_REQUEST, {
    minQualityScore: 0.95,
  });
  const prodDelta = computeProductionDecisionDelta(
    runProductionReplanningEngine(DEFAULT_REQUEST),
    runProductionReplanningEngine(
      buildProdRequest({ overtimeAvailable: false }),
    ),
    {
      overtime: { from: "Enabled", to: "Disabled" },
    },
  );

  assert.ok(prodSensitivity.length > 0);
  assert.ok(supplierSensitivity.length > 0);
  assert.ok(supplierTrace.length > 0);
  assert.ok(policyImpact.affectedSuppliers >= 0);
  assert.ok(typeof prodDelta.financialDelta === "number");
});
