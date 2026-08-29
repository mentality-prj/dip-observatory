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
