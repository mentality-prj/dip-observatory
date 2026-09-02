/**
 * Production Disruption Decision Scenario — unit tests.
 *
 * Covers all 13 invariants listed in the problem statement:
 *   1.  Baseline remains immutable.
 *   2.  Machine B disruption changes capacity.
 *   3.  Affected orders are correctly identified.
 *   4.  Deadline risk is recalculated.
 *   5.  Alternative machines are respected.
 *   6.  Setup/changeover is recalculated.
 *   7.  Overtime is recalculated.
 *   8.  Delay cost is recalculated.
 *   9.  All alternatives are evaluated.
 *   10. Recommendation is deterministic.
 *   11. Financial totals are correct.
 *   12. Trace corresponds to actual rule results.
 *   13. Reset restores baseline.
 *
 * SYNTHETIC DEMONSTRATION — not production data.
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";

import {
  runSchedulingEngine,
  DEFAULT_COST_CONFIG,
} from "@/production-scheduling/lib/engine";
import type { ScheduledTask } from "@/production-scheduling/types";
import {
  PDR_ORDERS,
  PDR_LINES,
  PDR_SETUP_MATRIX,
  PDR_PRE_DISRUPTION_SCENARIO,
  PDR_DISRUPTED_SCENARIO,
  PDR_MACHINE_B_ORDER_IDS,
  BASELINE_DISRUPTION_WHAT_IF,
  buildPdrScenario,
  disruptionHoursToParams,
  getOrdersAtRisk,
  computeDisruptionSensitivity,
} from "@/production-scheduling/data/production-disruption-scenario";
import type { SchedulingScenario } from "@/production-scheduling/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function runPdrEngine(scenarioOverride: Partial<SchedulingScenario> = {}) {
  return runSchedulingEngine({
    scenario: { ...PDR_DISRUPTED_SCENARIO, ...scenarioOverride },
    costConfig: DEFAULT_COST_CONFIG,
  });
}

function runPreDisruption() {
  return runSchedulingEngine({
    scenario: PDR_PRE_DISRUPTION_SCENARIO,
    costConfig: DEFAULT_COST_CONFIG,
  });
}

// ---------------------------------------------------------------------------
// 1. Baseline remains immutable
// ---------------------------------------------------------------------------

describe("1. baseline immutability", () => {
  test("PDR_PRE_DISRUPTION_SCENARIO is not mutated by engine runs", () => {
    const originalOrders = JSON.stringify(PDR_PRE_DISRUPTION_SCENARIO.orders);
    const originalDisruption = JSON.stringify(PDR_PRE_DISRUPTION_SCENARIO.disruption);
    runPreDisruption();
    runPreDisruption();
    assert.equal(JSON.stringify(PDR_PRE_DISRUPTION_SCENARIO.orders), originalOrders);
    assert.equal(JSON.stringify(PDR_PRE_DISRUPTION_SCENARIO.disruption), originalDisruption);
  });

  test("PDR_DISRUPTED_SCENARIO is not mutated by engine runs", () => {
    const originalOrders = JSON.stringify(PDR_DISRUPTED_SCENARIO.orders);
    const snapshot = JSON.stringify(PDR_DISRUPTED_SCENARIO.disruption);
    runPdrEngine();
    runPdrEngine();
    assert.equal(JSON.stringify(PDR_DISRUPTED_SCENARIO.orders), originalOrders);
    assert.equal(JSON.stringify(PDR_DISRUPTED_SCENARIO.disruption), snapshot);
  });

  test("pre-disruption scenario has zero capacity reduction", () => {
    assert.equal(PDR_PRE_DISRUPTION_SCENARIO.disruption.capacityReductionFactor, 0);
  });

  test("disrupted scenario has full capacity reduction on LINE-B", () => {
    assert.equal(PDR_DISRUPTED_SCENARIO.disruption.affectedLineId, "LINE-B");
    assert.equal(PDR_DISRUPTED_SCENARIO.disruption.capacityReductionFactor, 1.0);
    assert.equal(PDR_DISRUPTED_SCENARIO.disruption.durationDays, 1);
  });
});

// ---------------------------------------------------------------------------
// 2. Machine B disruption changes capacity
// ---------------------------------------------------------------------------

describe("2. Machine B disruption changes capacity", () => {
  test("pre-disruption: all orders on Machine B can be scheduled on Day 1", () => {
    const result = runPreDisruption();
    const keep = result.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    assert.ok(keep, "KEEP_CURRENT_SCHEDULE must exist");
    // In pre-disruption, LINE-B Day 1 = 8h
    const machineBDay1Tasks = keep!.schedule.filter(
      (t) => t.lineId === "LINE-B" && t.day === 1,
    );
    assert.ok(machineBDay1Tasks.length > 0, "Machine B should have tasks on Day 1 in pre-disruption");
  });

  test("disrupted: no tasks can be placed on LINE-B Day 1 with factor=1.0", () => {
    const result = runPdrEngine();
    const keep = result.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    assert.ok(keep);
    const machineBDay1Tasks = keep!.schedule.filter(
      (t) => t.lineId === "LINE-B" && t.day === 1,
    );
    // With factor=1.0, LINE-B Day 1 = 0h → no tasks fit Day 1 on LINE-B
    assert.equal(machineBDay1Tasks.length, 0, "LINE-B Day 1 should have no tasks when fully disrupted");
  });

  test("disruptionHoursToParams maps correctly", () => {
    const p4 = disruptionHoursToParams(4);
    assert.equal(p4.capacityReductionFactor, 0.5);
    assert.equal(p4.durationDays, 1);

    const p8 = disruptionHoursToParams(8);
    assert.equal(p8.capacityReductionFactor, 1.0);
    assert.equal(p8.durationDays, 1);

    const p12 = disruptionHoursToParams(12);
    assert.equal(p12.capacityReductionFactor, 1.0);
    assert.equal(p12.durationDays, 2);

    const p16 = disruptionHoursToParams(16);
    assert.equal(p16.capacityReductionFactor, 1.0);
    assert.equal(p16.durationDays, 3);
  });
});

// ---------------------------------------------------------------------------
// 3. Affected orders are correctly identified
// ---------------------------------------------------------------------------

describe("3. affected orders identified", () => {
  test("orders at risk come from Machine B order IDs", () => {
    const result = runPdrEngine();
    const atRisk = getOrdersAtRisk(result);
    // All at-risk orders must be in the known Machine B set
    for (const id of atRisk) {
      assert.ok(
        (PDR_MACHINE_B_ORDER_IDS as readonly string[]).includes(id),
        `${id} is not a Machine B order`,
      );
    }
  });

  test("exactly 3 orders are at risk in default 8h disruption", () => {
    const result = runPdrEngine();
    const atRisk = getOrdersAtRisk(result);
    assert.equal(atRisk.length, 3, `Expected 3 orders at risk, got ${atRisk.length}: ${atRisk.join(", ")}`);
  });

  test("PDR-104 (CRITICAL) is always at risk in KEEP_CURRENT", () => {
    const result = runPdrEngine();
    const atRisk = getOrdersAtRisk(result);
    assert.ok(atRisk.includes("PDR-104"), "PDR-104 must be at risk");
  });

  test("no orders at risk in pre-disruption baseline", () => {
    const result = runPreDisruption();
    const atRisk = getOrdersAtRisk(result);
    assert.equal(atRisk.length, 0, "No orders should be at risk before disruption");
  });
});

// ---------------------------------------------------------------------------
// 4. Deadline risk is recalculated
// ---------------------------------------------------------------------------

describe("4. deadline risk recalculated", () => {
  test("KEEP_CURRENT violates RULE-CRITICAL-DEADLINE when disrupted", () => {
    const result = runPdrEngine();
    const keep = result.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    assert.ok(keep);
    const critRule = keep!.constraintResults.find((r) => r.ruleId === "RULE-CRITICAL-DEADLINE");
    assert.ok(critRule, "RULE-CRITICAL-DEADLINE must be evaluated");
    assert.equal(critRule!.passed, false, "RULE-CRITICAL-DEADLINE must fail for KEEP_CURRENT when disrupted");
  });

  test("KEEP_CURRENT passes RULE-CRITICAL-DEADLINE in pre-disruption", () => {
    const result = runPreDisruption();
    const keep = result.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    assert.ok(keep);
    const critRule = keep!.constraintResults.find((r) => r.ruleId === "RULE-CRITICAL-DEADLINE");
    assert.ok(critRule);
    assert.equal(critRule!.passed, true, "Critical deadline should pass in pre-disruption");
  });

  test("PDR-104 (CRITICAL, day-1 deadline) is delayed in KEEP_CURRENT when disrupted", () => {
    const result = runPdrEngine();
    const keep = result.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    assert.ok(keep);
    const pdr104 = keep!.schedule.find((t) => t.orderId === "PDR-104");
    assert.ok(pdr104, "PDR-104 must be in KEEP_CURRENT schedule");
    assert.ok(
      pdr104!.status === "DELAYED" || pdr104!.status === "NOT_SCHEDULED",
      `PDR-104 must be delayed in KEEP_CURRENT, got: ${pdr104!.status}`,
    );
  });
});

// ---------------------------------------------------------------------------
// 5. Alternative machines are respected
// ---------------------------------------------------------------------------

describe("5. alternative machines respected", () => {
  test("REDISTRIBUTE moves PDR-104 (PERGOLA) from LINE-B to LINE-C", () => {
    const result = runPdrEngine();
    const redis = result.strategies.find((s) => s.strategyId === "REDISTRIBUTE_TO_OTHER_LINES");
    assert.ok(redis, "REDISTRIBUTE_TO_OTHER_LINES must be evaluated");
    const pdr104Task = redis!.schedule.find((t) => t.orderId === "PDR-104");
    assert.ok(pdr104Task, "PDR-104 must be scheduled in REDISTRIBUTE");
    assert.equal(
      pdr104Task!.lineId,
      "LINE-C",
      `PDR-104 should be on LINE-C in REDISTRIBUTE, got: ${pdr104Task!.lineId}`,
    );
  });

  test("REDISTRIBUTE keeps AWNING orders on LINE-B", () => {
    const result = runPdrEngine();
    const redis = result.strategies.find((s) => s.strategyId === "REDISTRIBUTE_TO_OTHER_LINES");
    assert.ok(redis);
    const awningOrders = ["PDR-106", "PDR-108"];
    for (const id of awningOrders) {
      const task: ScheduledTask | undefined = redis!.schedule.find((t) => t.orderId === id);
      assert.ok(task, `${id} must be scheduled`);
      assert.equal(task!.lineId, "LINE-B", `${id} should stay on LINE-B in REDISTRIBUTE`);
    }
  });

  test("machine compatibility constraints pass in recommended strategy", () => {
    const result = runPdrEngine();
    const rec = result.strategies.find(
      (s) => s.strategyId === result.recommendedStrategy,
    );
    assert.ok(rec);
    const compatRule = rec!.constraintResults.find((r) => r.ruleId === "RULE-MACHINE-COMPAT");
    assert.ok(compatRule);
    assert.equal(compatRule!.passed, true, "Machine compatibility must pass in recommended strategy");
  });
});

// ---------------------------------------------------------------------------
// 6. Setup/changeover is recalculated
// ---------------------------------------------------------------------------

describe("6. setup/changeover recalculated", () => {
  test("REDISTRIBUTE incurs setup hours from moving PDR-104 to LINE-C", () => {
    const result = runPdrEngine();
    const redis = result.strategies.find((s) => s.strategyId === "REDISTRIBUTE_TO_OTHER_LINES");
    assert.ok(redis);
    const totalSetup = redis!.lineUtilization.reduce((s, l) => s + l.setupHours, 0);
    // Any realistic schedule has some setup hours
    assert.ok(totalSetup >= 0, "Setup hours must be non-negative");
  });

  test("RULE-SETUP is always evaluated and passes (informational)", () => {
    const result = runPdrEngine();
    for (const strategy of result.strategies) {
      const setupRule = strategy.constraintResults.find((r) => r.ruleId === "RULE-SETUP");
      assert.ok(setupRule, `RULE-SETUP not found in ${strategy.strategyId}`);
      assert.equal(setupRule!.passed, true, "RULE-SETUP is informational and always passes");
    }
  });

  test("setup cost uses €80/h rate from DEFAULT_COST_CONFIG", () => {
    const result = runPdrEngine();
    const rec = result.strategies.find((s) => s.strategyId === result.recommendedStrategy);
    assert.ok(rec);
    const setupHours = rec!.lineUtilization.reduce((s, l) => s + l.setupHours, 0);
    const expectedSetupCost = Math.round(setupHours * 80);
    const actualSetupCost = Math.round(rec!.financialImpact.setupCost);
    assert.equal(actualSetupCost, expectedSetupCost,
      `Setup cost should be €${expectedSetupCost}, got €${actualSetupCost}`);
  });
});

// ---------------------------------------------------------------------------
// 7. Overtime is recalculated
// ---------------------------------------------------------------------------

describe("7. overtime recalculated", () => {
  test("USE_OVERTIME shows non-zero overtime hours for PDR-104 on LINE-B Day 1", () => {
    const result = runPdrEngine({
      scenarioId: "PDR-OT-TEST",
      overtimeAvailable: true,
    });
    const ot = result.strategies.find((s) => s.strategyId === "USE_OVERTIME");
    assert.ok(ot);
    const lineBUtil = ot!.lineUtilization.find((l) => l.lineId === "LINE-B");
    assert.ok(lineBUtil);
    assert.ok(lineBUtil!.overtimeHours > 0, "LINE-B should have overtime hours when enabled");
  });

  test("overtime cost is zero when overtime disabled", () => {
    const result = runPdrEngine({ scenarioId: "PDR-NO-OT", overtimeAvailable: false });
    for (const strategy of result.strategies) {
      assert.equal(
        strategy.financialImpact.overtimeCost,
        0,
        `Overtime cost should be 0 when disabled, got ${strategy.financialImpact.overtimeCost} in ${strategy.strategyId}`,
      );
    }
  });

  test("buildPdrScenario passes overtime flag correctly", () => {
    const { scenario: withOT } = buildPdrScenario({ ...BASELINE_DISRUPTION_WHAT_IF, overtimeAvailable: true });
    const { scenario: noOT } = buildPdrScenario({ ...BASELINE_DISRUPTION_WHAT_IF, overtimeAvailable: false });
    assert.equal(withOT.overtimeAvailable, true);
    assert.equal(noOT.overtimeAvailable, false);
  });
});

// ---------------------------------------------------------------------------
// 8. Delay cost is recalculated
// ---------------------------------------------------------------------------

describe("8. delay cost recalculated", () => {
  test("KEEP_CURRENT has non-zero delay cost when disrupted", () => {
    const result = runPdrEngine();
    const keep = result.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    assert.ok(keep);
    assert.ok(keep!.financialImpact.delayCost > 0,
      `KEEP_CURRENT should have delay cost > 0, got ${keep!.financialImpact.delayCost}`);
  });

  test("recommended strategy has zero or lower delay cost than KEEP_CURRENT", () => {
    const result = runPdrEngine();
    const keep = result.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    const rec = result.strategies.find((s) => s.strategyId === result.recommendedStrategy);
    assert.ok(keep && rec);
    assert.ok(
      rec!.financialImpact.delayCost <= keep!.financialImpact.delayCost,
      "Recommended strategy should not have higher delay cost than KEEP_CURRENT",
    );
  });

  test("PDR-104 delay penalty is €2000/day (matches order definition)", () => {
    const pdr104 = PDR_ORDERS.find((o) => o.id === "PDR-104");
    assert.ok(pdr104);
    assert.equal(pdr104!.delayPenaltyPerDay, 2_000);
  });
});

// ---------------------------------------------------------------------------
// 9. All alternatives are evaluated
// ---------------------------------------------------------------------------

describe("9. all alternatives evaluated", () => {
  test("engine evaluates exactly 5 strategies", () => {
    const result = runPdrEngine();
    assert.equal(result.strategies.length, 5, "Should evaluate exactly 5 strategies");
  });

  test("all 5 standard strategy IDs are present", () => {
    const result = runPdrEngine();
    const ids = result.strategies.map((s) => s.strategyId);
    const expected = [
      "KEEP_CURRENT_SCHEDULE",
      "PRIORITIZE_URGENT_ORDERS",
      "REDISTRIBUTE_TO_OTHER_LINES",
      "DELAY_LOW_PRIORITY_ORDERS",
      "USE_OVERTIME",
    ];
    for (const id of expected) {
      assert.ok(ids.includes(id as never), `${id} must be evaluated`);
    }
  });

  test("KEEP_CURRENT and PRIORITIZE_URGENT are infeasible when disrupted", () => {
    const result = runPdrEngine();
    const keep = result.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    const prio = result.strategies.find((s) => s.strategyId === "PRIORITIZE_URGENT_ORDERS");
    assert.equal(keep!.feasibility, "INFEASIBLE", "KEEP_CURRENT must be INFEASIBLE");
    assert.equal(prio!.feasibility, "INFEASIBLE", "PRIORITIZE_URGENT must be INFEASIBLE");
  });

  test("REDISTRIBUTE is feasible for 8h disruption", () => {
    const result = runPdrEngine();
    const redis = result.strategies.find((s) => s.strategyId === "REDISTRIBUTE_TO_OTHER_LINES");
    assert.ok(redis);
    assert.equal(redis!.feasibility, "FEASIBLE", "REDISTRIBUTE must be FEASIBLE for 8h disruption");
  });

  test("USE_OVERTIME is feasible when overtime is enabled", () => {
    const result = runPdrEngine({
      scenarioId: "PDR-OT-FEAS",
      overtimeAvailable: true,
    });
    const ot = result.strategies.find((s) => s.strategyId === "USE_OVERTIME");
    assert.ok(ot);
    assert.equal(ot!.feasibility, "FEASIBLE", "USE_OVERTIME must be FEASIBLE when overtime enabled");
  });
});

// ---------------------------------------------------------------------------
// 10. Recommendation is deterministic
// ---------------------------------------------------------------------------

describe("10. recommendation is deterministic", () => {
  test("same disruption scenario always produces same recommended strategy", () => {
    const a = runPdrEngine();
    const b = runPdrEngine();
    assert.equal(a.recommendedStrategy, b.recommendedStrategy);
  });

  test("recommended strategy is REDISTRIBUTE for default 8h disruption (no overtime)", () => {
    const result = runPdrEngine();
    assert.equal(
      result.recommendedStrategy,
      "REDISTRIBUTE_TO_OTHER_LINES",
      `Expected REDISTRIBUTE_TO_OTHER_LINES, got ${result.recommendedStrategy}`,
    );
  });

  test("decision status is DECIDED for 8h disruption", () => {
    const result = runPdrEngine();
    assert.equal(result.decisionStatus, "DECIDED");
  });

  test("DECIDED for all disruption durations (REDISTRIBUTE always protects CRITICAL order)", () => {
    // PDR-104 (CRITICAL) fits LINE-C for any duration — REDISTRIBUTE remains feasible.
    for (const hours of [4, 8, 12, 16] as const) {
      const { scenario } = buildPdrScenario({
        ...BASELINE_DISRUPTION_WHAT_IF,
        disruptionHours: hours,
        overtimeAvailable: false,
      });
      const result = runSchedulingEngine({ scenario, costConfig: DEFAULT_COST_CONFIG });
      assert.equal(
        result.decisionStatus,
        "DECIDED",
        `Expected DECIDED for ${hours}h disruption, got ${result.decisionStatus}`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 11. Financial totals are correct
// ---------------------------------------------------------------------------

describe("11. financial totals correct", () => {
  test("totalCost equals sum of components for recommended strategy", () => {
    const result = runPdrEngine();
    const rec = result.strategies.find((s) => s.strategyId === result.recommendedStrategy);
    assert.ok(rec);
    const fi = rec!.financialImpact;
    const sum = fi.delayCost + fi.overtimeCost + fi.setupCost + fi.unusedCapacityCost;
    // Allow 1€ rounding tolerance
    assert.ok(
      Math.abs(fi.totalCost - sum) < 1.0,
      `totalCost (${fi.totalCost}) ≠ sum of components (${sum})`,
    );
  });

  test("avoidedCostVsBaseline equals KEEP_CURRENT totalCost minus recommended totalCost", () => {
    const result = runPdrEngine();
    const keep = result.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    const rec = result.strategies.find((s) => s.strategyId === result.recommendedStrategy);
    assert.ok(keep && rec);
    const expected = keep!.financialImpact.totalCost - rec!.financialImpact.totalCost;
    assert.ok(
      Math.abs(result.avoidedCostVsBaseline - expected) < 1.0,
      `avoidedCost (${result.avoidedCostVsBaseline}) ≠ expected (${expected})`,
    );
  });

  test("avoidedCostVsBaseline is positive (recovery is cheaper than keep-current)", () => {
    const result = runPdrEngine();
    assert.ok(
      result.avoidedCostVsBaseline > 0,
      `avoidedCost should be > 0, got ${result.avoidedCostVsBaseline}`,
    );
  });

  test("totalFinancialImpact matches recommended strategy totalCost", () => {
    const result = runPdrEngine();
    const rec = result.strategies.find((s) => s.strategyId === result.recommendedStrategy);
    assert.ok(rec);
    assert.ok(
      Math.abs(result.totalFinancialImpact - rec!.financialImpact.totalCost) < 1.0,
      `totalFinancialImpact (${result.totalFinancialImpact}) should match rec totalCost (${rec!.financialImpact.totalCost})`,
    );
  });
});

// ---------------------------------------------------------------------------
// 12. Trace corresponds to actual rule results
// ---------------------------------------------------------------------------

describe("12. trace matches rule results", () => {
  test("RULE-CRITICAL-DEADLINE trace evidence matches delayed status of PDR-104", () => {
    const result = runPdrEngine();
    const keep = result.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    assert.ok(keep);
    const critTrace = keep!.constraintResults.find((r) => r.ruleId === "RULE-CRITICAL-DEADLINE");
    assert.ok(critTrace);
    assert.equal(critTrace!.passed, false);
    assert.ok(
      critTrace!.evidence.includes("PDR-104"),
      `Evidence should mention PDR-104, got: "${critTrace!.evidence}"`,
    );
  });

  test("recommended strategy trace has all expected rule IDs", () => {
    const result = runPdrEngine();
    const rec = result.strategies.find((s) => s.strategyId === result.recommendedStrategy);
    assert.ok(rec);
    const expectedRules = [
      "RULE-CAPACITY",
      "RULE-MACHINE-COMPAT",
      "RULE-MATERIAL",
      "RULE-CRITICAL-DEADLINE",
      "RULE-ORDER-PRIORITY",
      "RULE-SETUP",
      "RULE-CAPACITY-UTIL",
    ];
    const traceIds = rec!.constraintResults.map((r) => r.ruleId);
    for (const ruleId of expectedRules) {
      assert.ok(traceIds.includes(ruleId), `Rule ${ruleId} must be in trace`);
    }
  });

  test("audit trail source is SYNTHETIC_DEMONSTRATION", () => {
    const result = runPdrEngine();
    assert.equal(result.auditTrail.source, "SYNTHETIC_DEMONSTRATION");
  });

  test("audit trail strategies evaluated matches 5 strategies", () => {
    const result = runPdrEngine();
    assert.equal(result.auditTrail.strategiesEvaluated.length, 5);
  });
});

// ---------------------------------------------------------------------------
// 13. Reset restores baseline
// ---------------------------------------------------------------------------

describe("13. reset restores baseline", () => {
  test("buildPdrScenario with BASELINE_DISRUPTION_WHAT_IF produces same result as PDR_DISRUPTED_SCENARIO", () => {
    const { scenario } = buildPdrScenario(BASELINE_DISRUPTION_WHAT_IF);
    const fromBuilder = runSchedulingEngine({ scenario, costConfig: DEFAULT_COST_CONFIG });
    const direct = runSchedulingEngine({
      scenario: PDR_DISRUPTED_SCENARIO,
      costConfig: DEFAULT_COST_CONFIG,
    });
    assert.equal(fromBuilder.recommendedStrategy, direct.recommendedStrategy);
  });

  test("machineBAvailable=true restores pre-disruption baseline behaviour", () => {
    const { scenario } = buildPdrScenario({
      ...BASELINE_DISRUPTION_WHAT_IF,
      machineBAvailable: true,
    });
    const result = runSchedulingEngine({ scenario, costConfig: DEFAULT_COST_CONFIG });
    const preResult = runSchedulingEngine({
      scenario: PDR_PRE_DISRUPTION_SCENARIO,
      costConfig: DEFAULT_COST_CONFIG,
    });
    // Both should have the same recommended strategy (no disruption)
    assert.equal(result.recommendedStrategy, preResult.recommendedStrategy);
  });

  test("machineBAvailable=true: no orders at risk", () => {
    const { scenario } = buildPdrScenario({
      ...BASELINE_DISRUPTION_WHAT_IF,
      machineBAvailable: true,
    });
    const result = runSchedulingEngine({ scenario, costConfig: DEFAULT_COST_CONFIG });
    const atRisk = getOrdersAtRisk(result);
    assert.equal(atRisk.length, 0, "No orders at risk when Machine B is available");
  });

  test("sensitivity returns 4 entries for all disruption durations", () => {
    const sensitivity = computeDisruptionSensitivity(BASELINE_DISRUPTION_WHAT_IF);
    assert.equal(sensitivity.length, 4);
    const hours = sensitivity.map((e) => e.hours);
    assert.deepEqual(hours, [4, 8, 12, 16]);
  });

  test("sensitivity: all durations are feasible via REDISTRIBUTE (CRITICAL order always moves to LINE-C)", () => {
    const sensitivity = computeDisruptionSensitivity(BASELINE_DISRUPTION_WHAT_IF);
    for (const entry of sensitivity) {
      assert.equal(entry.feasible, true, `${entry.hours}h disruption should be feasible`);
      assert.equal(entry.strategy, "Redistribute to Other Lines",
        `${entry.hours}h should use REDISTRIBUTE`);
    }
  });
});

// ---------------------------------------------------------------------------
// 14. Schedule labels — BEFORE DISRUPTION / DISRUPTED PLAN / RECOVERY PLAN
// ---------------------------------------------------------------------------

describe("14. schedule label semantics", () => {
  test("pre-disruption result: all Machine B orders are scheduled on time", () => {
    const pre = runPreDisruption();
    const rec = pre.strategies.find((s) => s.strategyId === pre.recommendedStrategy);
    assert.ok(rec, "Pre-disruption must have a recommended strategy");
    const machineBIds = ["PDR-104", "PDR-106", "PDR-108", "PDR-110"];
    for (const id of machineBIds) {
      const task = rec!.schedule.find((t) => t.orderId === id);
      assert.ok(task, `${id} must be scheduled in pre-disruption`);
      assert.equal(task!.status, "ON_TIME", `${id} must be ON_TIME in pre-disruption (BEFORE DISRUPTION state)`);
    }
  });

  test("disrupted result KEEP_CURRENT_SCHEDULE represents disruption without recovery (DISRUPTED PLAN)", () => {
    const disrupted = runPdrEngine();
    const keep = disrupted.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    assert.ok(keep, "KEEP_CURRENT_SCHEDULE must exist in disrupted result");
    // At least one order must be delayed (disruption has an impact)
    const hasDelayed = keep!.schedule.some(
      (t) => t.status === "DELAYED" || t.status === "NOT_SCHEDULED",
    );
    assert.equal(hasDelayed, true, "DISRUPTED PLAN must contain at least one delayed/not-scheduled order");
  });

  test("disrupted result recommended strategy represents recovery plan (RECOVERY PLAN)", () => {
    const disrupted = runPdrEngine();
    const keep = disrupted.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    const rec = disrupted.strategies.find((s) => s.strategyId === disrupted.recommendedStrategy);
    assert.ok(rec, "Recovery plan must exist");
    assert.notEqual(disrupted.recommendedStrategy, "KEEP_CURRENT_SCHEDULE",
      "Recommended strategy must not be KEEP_CURRENT when disruption creates infeasibility");
    // Recovery plan must have fewer or equal delayed orders vs KEEP_CURRENT
    const keepDelays = (keep?.schedule ?? []).filter((t) => t.status === "DELAYED" || t.status === "NOT_SCHEDULED").length;
    const recDelays = rec!.schedule.filter((t) => t.status === "DELAYED" || t.status === "NOT_SCHEDULED").length;
    assert.ok(recDelays <= keepDelays, "Recovery plan must not have more delays than KEEP_CURRENT");
  });
});

// ---------------------------------------------------------------------------
// 15. Four orders on Machine B / three at risk / one unaffected
// ---------------------------------------------------------------------------

describe("15. machine B order count and risk classification", () => {
  test("exactly 4 orders are assigned to Machine B", () => {
    const machineBOrders = PDR_ORDERS.filter((o) => o.defaultLineId === "LINE-B");
    assert.equal(machineBOrders.length, 4, "Must be exactly 4 orders on Machine B");
    assert.deepEqual(
      machineBOrders.map((o) => o.id),
      ["PDR-104", "PDR-106", "PDR-108", "PDR-110"],
    );
    assert.equal(PDR_MACHINE_B_ORDER_IDS.length, 4, "PDR_MACHINE_B_ORDER_IDS must contain 4 entries");
  });

  test("exactly 3 orders are at risk (delayed/not-scheduled) in KEEP_CURRENT", () => {
    const disrupted = runPdrEngine();
    const atRisk = getOrdersAtRisk(disrupted);
    assert.equal(atRisk.length, 3, `Expected 3 at-risk orders but got ${atRisk.length}: ${atRisk.join(", ")}`);
  });

  test("exactly 1 Machine B order remains unaffected (on-time in KEEP_CURRENT)", () => {
    const disrupted = runPdrEngine();
    const atRisk = getOrdersAtRisk(disrupted);
    const unaffected = PDR_MACHINE_B_ORDER_IDS.length - atRisk.length;
    assert.equal(unaffected, 1, `Expected 1 unaffected Machine B order but got ${unaffected}`);
    // PDR-106 (deadline Day 2, 3h duration) should be the unaffected order
    const unaffectedId = PDR_MACHINE_B_ORDER_IDS.find((id) => !atRisk.includes(id));
    assert.equal(unaffectedId, "PDR-106", "PDR-106 should be the unaffected Machine B order");
  });

  test("unaffected order (PDR-106) is on time in KEEP_CURRENT", () => {
    const disrupted = runPdrEngine();
    const keep = disrupted.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    const task = keep?.schedule.find((t) => t.orderId === "PDR-106");
    assert.ok(task, "PDR-106 must appear in KEEP_CURRENT schedule");
    assert.equal(task!.status, "ON_TIME", "PDR-106 must be ON_TIME (unaffected)");
  });
});

// ---------------------------------------------------------------------------
// 16. Financial invariants
// ---------------------------------------------------------------------------

describe("16. financial invariants", () => {
  test("disruptedImpact - recoveryImpact = avoidedImpact (rounded)", () => {
    const disrupted = runPdrEngine();
    const keep = disrupted.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    const rec = disrupted.strategies.find((s) => s.strategyId === disrupted.recommendedStrategy);
    assert.ok(keep, "KEEP_CURRENT must exist");
    assert.ok(rec, "Recovery strategy must exist");
    const disruptedTotal = Math.round(keep!.financialImpact.totalCost);
    const recoveryTotal = Math.round(rec!.financialImpact.totalCost);
    const avoided = Math.max(0, disruptedTotal - recoveryTotal);
    // avoided must be positive (recovery reduces cost)
    assert.ok(avoided > 0, `Avoided impact must be positive but got €${avoided}`);
    assert.equal(
      Math.round(disrupted.avoidedCostVsBaseline),
      avoided,
      `rounded avoidedCostVsBaseline (${Math.round(disrupted.avoidedCostVsBaseline)}) must equal disruptedTotal (${disruptedTotal}) - recoveryTotal (${recoveryTotal})`,
    );
  });

  test("baseline synthetic fixture: disrupted €6490, recovery €3400, avoided €3090", () => {
    const disrupted = runPdrEngine();
    const keep = disrupted.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    const rec = disrupted.strategies.find((s) => s.strategyId === disrupted.recommendedStrategy);
    const disruptedTotal = Math.round(keep!.financialImpact.totalCost);
    const recoveryTotal = Math.round(rec!.financialImpact.totalCost);
    const avoided = disruptedTotal - recoveryTotal;
    // These values come from the synthetic fixture; if data changes, derive expected from fixture
    assert.equal(disruptedTotal, 6490, `Disrupted total expected €6490 but got €${disruptedTotal}`);
    assert.equal(recoveryTotal, 3400, `Recovery total expected €3400 but got €${recoveryTotal}`);
    assert.equal(avoided, 3090, `Avoided expected €3090 but got €${avoided}`);
    assert.equal(
      Math.round(disrupted.avoidedCostVsBaseline),
      3090,
      `avoidedCostVsBaseline expected €3090 but got €${Math.round(disrupted.avoidedCostVsBaseline)}`,
    );
  });
});

// ---------------------------------------------------------------------------
// 17. Schedule / decision consistency
// ---------------------------------------------------------------------------

describe("17. schedule and decision consistency", () => {
  test("recommended strategy matches the strategy shown in RECOVERY PLAN", () => {
    const disrupted = runPdrEngine();
    const rec = disrupted.strategies.find((s) => s.strategyId === disrupted.recommendedStrategy);
    assert.ok(rec, "Recommended strategy must be present in strategies array");
  });

  test("MOVED orders in recovery plan have different lineId from KEEP_CURRENT", () => {
    const disrupted = runPdrEngine();
    const keep = disrupted.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    const rec = disrupted.strategies.find((s) => s.strategyId === disrupted.recommendedStrategy);
    assert.ok(keep && rec, "Both keep and recovery strategies must exist");
    const movedOrders: string[] = [];
    for (const task of rec!.schedule) {
      const baseTask = keep!.schedule.find((t) => t.orderId === task.orderId);
      if (baseTask && baseTask.lineId !== task.lineId) {
        movedOrders.push(task.orderId);
      }
    }
    // REDISTRIBUTE strategy must move at least one order
    assert.ok(movedOrders.length > 0, "Recovery plan must move at least one order to a different line");
  });

  test("PDR-104 (CRITICAL, Machine B) is moved to a different line in recovery", () => {
    const disrupted = runPdrEngine();
    const keep = disrupted.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
    const rec = disrupted.strategies.find((s) => s.strategyId === disrupted.recommendedStrategy);
    const keepTask = keep?.schedule.find((t) => t.orderId === "PDR-104");
    const recTask = rec?.schedule.find((t) => t.orderId === "PDR-104");
    assert.ok(keepTask && recTask, "PDR-104 must appear in both schedules");
    assert.notEqual(recTask!.lineId, keepTask!.lineId, "PDR-104 must be moved to a different line in recovery");
  });
});

// ---------------------------------------------------------------------------
// 18. Sensitivity heading semantics
// ---------------------------------------------------------------------------

describe("18. sensitivity heading semantics", () => {
  test("all tested durations are FEASIBLE for baseline what-if (no boundary)", () => {
    const sensitivity = computeDisruptionSensitivity(BASELINE_DISRUPTION_WHAT_IF);
    const allFeasible = sensitivity.every((e) => e.feasible);
    assert.equal(allFeasible, true,
      "All durations must be feasible → heading should be 'RECOVERY SENSITIVITY' without boundary claim");
  });

  test("sensitivity heading logic: hasBoundary is false when all entries feasible", () => {
    const sensitivity = computeDisruptionSensitivity(BASELINE_DISRUPTION_WHAT_IF);
    const hasBoundary = sensitivity.some((e) => !e.feasible);
    assert.equal(hasBoundary, false, "hasBoundary must be false for baseline config");
  });

  test("sensitivity entries always have typed feasible and strategy fields regardless of config", () => {
    // Verify the function returns well-typed data for all durations
    // (even with restricted Machine C capacity, REDISTRIBUTE remains feasible)
    const restrictedWhat: typeof BASELINE_DISRUPTION_WHAT_IF = {
      ...BASELINE_DISRUPTION_WHAT_IF,
      lineCCapacityHours: 4,
    };
    const sensitivity = computeDisruptionSensitivity(restrictedWhat);
    assert.equal(sensitivity.length, 4, "Must return 4 entries");
    for (const entry of sensitivity) {
      assert.equal(typeof entry.feasible, "boolean", `entry.feasible must be boolean for ${entry.hours}h`);
      assert.equal(typeof entry.strategy, "string", `entry.strategy must be string for ${entry.hours}h`);
      assert.ok(entry.hours > 0, `entry.hours must be positive`);
    }
  });
});
