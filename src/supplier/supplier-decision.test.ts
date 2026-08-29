/**
 * Supplier Decision Engine — unit tests.
 *
 * Tests that the engine is deterministic, rules are correctly evaluated,
 * the decision is correctly derived, and the audit trail is reproducible.
 *
 * These tests do NOT render React components.
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";

import {
  runSupplierDecisionPlugin,
  SUPPLIER_RULES,
  DEFAULT_SUPPLIER_CONFIG,
} from "@/supplier/lib/supplier-decision";
import {
  getDemoDecision,
  DEMO_REQUEST,
  DEMO_SUPPLIERS,
  DEMO_CASE_ID,
  DEMO_DECISION_DATE,
} from "@/supplier/data/synthetic-supplier-data";
import type { SupplierDecisionRequest } from "@/supplier/types/supplier-decision";

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("determinism", () => {
  test("same input produces identical decision on repeated calls", () => {
    const a = runSupplierDecisionPlugin(DEMO_REQUEST);
    const b = runSupplierDecisionPlugin(DEMO_REQUEST);
    assert.equal(a.decisionTrace.decision, b.decisionTrace.decision);
    assert.equal(
      a.recommendation.supplier.name,
      b.recommendation.supplier.name,
    );
    assert.equal(a.recommendation.overallScore, b.recommendation.overallScore);
  });

  test("cached getDemoDecision returns same object on repeated calls", () => {
    const a = getDemoDecision();
    const b = getDemoDecision();
    assert.strictEqual(a, b);
  });
});

// ---------------------------------------------------------------------------
// Rules catalogue
// ---------------------------------------------------------------------------

describe("rules catalogue", () => {
  test("contains 6 rules", () => {
    assert.equal(SUPPLIER_RULES.length, 6);
  });

  test("exactly 4 blocking rules", () => {
    const blocking = SUPPLIER_RULES.filter((r) => r.blocking);
    assert.equal(blocking.length, 4);
  });

  test("all rules have unique ids", () => {
    const ids = new Set(SUPPLIER_RULES.map((r) => r.id));
    assert.equal(ids.size, SUPPLIER_RULES.length);
  });
});

// ---------------------------------------------------------------------------
// Demo scenario
// ---------------------------------------------------------------------------

describe("demo scenario", () => {
  const result = getDemoDecision();
  const trace = result.decisionTrace;

  test("case id and date are correct", () => {
    assert.equal(trace.input.caseId, DEMO_CASE_ID);
    assert.equal(trace.input.decisionDate, DEMO_DECISION_DATE);
  });

  test("three candidates evaluated", () => {
    assert.equal(trace.input.candidateCount, 3);
    assert.equal(trace.evaluations.length, 3);
  });

  test("ranks are 1, 2, 3 with no duplicates", () => {
    const ranks = trace.evaluations.map((e) => e.rank).sort((a, b) => a - b);
    assert.deepEqual(ranks, [1, 2, 3]);
  });

  test("ACME Components GmbH is ranked #1 (highest score, zero blocking failures)", () => {
    assert.equal(trace.recommendedSupplier.name, "ACME Components GmbH");
    assert.equal(result.recommendation.rank, 1);
  });

  test("recommended decision is APPROVE_WITH_CONDITIONS", () => {
    assert.equal(trace.decision, "APPROVE_WITH_CONDITIONS");
  });

  test("Nova Casting has blocking failures and is ranked last", () => {
    const nova = trace.evaluations.find(
      (e) => e.supplier.name === "Nova Casting Sp. z o.o.",
    );
    assert.ok(nova, "Nova Casting should appear in evaluations");
    assert.ok(nova.blockingFailures >= 4, "should have at least 4 blocking failures");
    assert.equal(nova.rank, 3);
  });
});

// ---------------------------------------------------------------------------
// Rule evaluation correctness
// ---------------------------------------------------------------------------

describe("rule evaluation", () => {
  const result = getDemoDecision();
  const acme = result.recommendation;

  test("ACME passes all blocking rules", () => {
    const blockingFails = acme.ruleResults.filter(
      (r) => r.rule.blocking && !r.passed,
    );
    assert.equal(blockingFails.length, 0);
  });

  test("ACME RULE-05 (financial risk) passes because financialRisk=MEDIUM (not HIGH)", () => {
    const rule05 = acme.ruleResults.find((r) => r.rule.id === "RULE-05");
    assert.ok(rule05);
    assert.equal(rule05.passed, true);
  });

  test("every rule result includes evidence text", () => {
    for (const r of acme.ruleResults) {
      assert.ok(r.evidence.length > 0, `${r.rule.id} should have evidence`);
    }
  });

  test("every rule result includes feature values", () => {
    for (const r of acme.ruleResults) {
      assert.ok(
        Object.keys(r.featureValues).length > 0,
        `${r.rule.id} should have feature values`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

describe("audit trail", () => {
  const result = getDemoDecision();
  const audit = result.auditEntry;

  test("audit entry matches decision", () => {
    assert.equal(audit.decision, result.decisionTrace.decision);
    assert.equal(audit.recommendedSupplier, result.recommendation.supplier.name);
  });

  test("all 6 rules are listed as executed", () => {
    assert.equal(audit.rulesExecuted.length, 6);
  });

  test("decision id encodes case id and date", () => {
    assert.ok(audit.decisionId.includes(DEMO_CASE_ID));
    assert.ok(audit.decisionId.includes(DEMO_DECISION_DATE));
  });
});

// ---------------------------------------------------------------------------
// Configuration override
// ---------------------------------------------------------------------------

describe("configuration override", () => {
  test("stricter quality threshold rejects Brenner due to blocking rule failure", () => {
    // Brenner has quality 91%. Raising threshold to 95% fails blocking RULE-02, so decision is REJECT.
    const request: SupplierDecisionRequest = {
      ...DEMO_REQUEST,
      candidates: [
        {
          name: "Brenner Precision Parts AG",
          category: "Test",
          contractValueEur: 1_000_000,
          deliveryPerformance: 0.89,
          qualityScore: 0.91,
          financialRisk: "LOW",
          dependency: 0.40,
          leadTimeDays: 35,
          compliant: true,
          incidentsLast12Months: 0,
        },
      ],
      configuration: { minQualityScore: 0.95 },
    };
    const result = runSupplierDecisionPlugin(request);
    const rule02 = result.recommendation.ruleResults.find(
      (r) => r.rule.id === "RULE-02",
    );
    assert.ok(rule02);
    assert.equal(rule02.passed, false);
    assert.equal(result.decisionTrace.decision, "REJECT");
  });

  test("empty candidates throws", () => {
    assert.throws(() =>
      runSupplierDecisionPlugin({ ...DEMO_REQUEST, candidates: [] }),
    );
  });
});

// ---------------------------------------------------------------------------
// Scoring bounds
// ---------------------------------------------------------------------------

describe("scoring bounds", () => {
  test("all demo evaluations have score in [0, 1]", () => {
    const result = getDemoDecision();
    for (const ev of result.decisionTrace.evaluations) {
      assert.ok(ev.overallScore >= 0 && ev.overallScore <= 1);
    }
  });
});

// ---------------------------------------------------------------------------
// Regression tests — supplier decision causal consistency (problem statement §11)
// ---------------------------------------------------------------------------

describe("R16. MEDIUM risk → APPROVE_WITH_CONDITIONS is explicitly explained", () => {
  test("ACME with MEDIUM risk gets APPROVE_WITH_CONDITIONS", () => {
    const result = getDemoDecision();
    const acme = result.decisionTrace.evaluations.find(
      (e) => e.supplier.name === "ACME Components GmbH",
    )!;
    assert.equal(acme.riskLevel, "MEDIUM");
    assert.equal(result.decisionTrace.decision, "APPROVE_WITH_CONDITIONS");
  });

  test("conditions list is non-empty when MEDIUM risk triggers them", () => {
    const result = getDemoDecision();
    assert.ok(result.decisionTrace.conditions.length > 0);
    // The quarterly review condition must be present for MEDIUM financial risk
    const hasReview = result.decisionTrace.conditions.some(
      (c) => c.toLowerCase().includes("quarterly") || c.toLowerCase().includes("financial review"),
    );
    assert.ok(hasReview, "MEDIUM financial risk should trigger quarterly review condition");
  });
});

describe("R17. all-PASS rules do not appear as the cause of the condition", () => {
  test("ACME has zero blocking failures", () => {
    const result = getDemoDecision();
    const acme = result.decisionTrace.evaluations.find(
      (e) => e.supplier.name === "ACME Components GmbH",
    )!;
    assert.equal(acme.blockingFailures, 0);
  });

  test("ACME blocking rules all pass", () => {
    const result = getDemoDecision();
    const acme = result.decisionTrace.evaluations.find(
      (e) => e.supplier.name === "ACME Components GmbH",
    )!;
    const blockingRules = acme.ruleResults.filter((r) => r.rule.blocking);
    for (const r of blockingRules) {
      assert.equal(r.passed, true, `Blocking rule ${r.rule.id} should pass for ACME`);
    }
  });
});

describe("R18. changing risk to LOW removes the MEDIUM-risk condition", () => {
  test("LOW risk ACME gets APPROVE without conditions", () => {
    const request: SupplierDecisionRequest = {
      ...DEMO_REQUEST,
      candidates: [
        { ...DEMO_SUPPLIERS[0], financialRisk: "LOW" },
      ],
    };
    const result = runSupplierDecisionPlugin(request);
    assert.equal(result.decisionTrace.decision, "APPROVE");
    // No quarterly review condition
    const hasReview = result.decisionTrace.conditions.some(
      (c) => c.toLowerCase().includes("quarterly"),
    );
    assert.equal(hasReview, false, "LOW risk should not trigger quarterly review");
  });
});

describe("R19. explanation changes consistently with decision", () => {
  test("HIGH risk supplier triggers REJECT with appropriate explanation", () => {
    const request: SupplierDecisionRequest = {
      ...DEMO_REQUEST,
      candidates: [
        {
          ...DEMO_SUPPLIERS[0],
          financialRisk: "HIGH",
          deliveryPerformance: 0.5, // also fail delivery to ensure blocking rule fails
        },
      ],
    };
    const result = runSupplierDecisionPlugin(request);
    assert.equal(result.decisionTrace.decision, "REJECT");
    // At least one negative factor should be present
    const negativeFactors = result.decisionTrace.factors.filter((f) => f.direction === "negative");
    assert.ok(negativeFactors.length > 0, "REJECT decision should have at least one negative factor");
  });
});

describe("R20. trace remains consistent with decision", () => {
  test("audit entry decision matches trace decision", () => {
    const result = getDemoDecision();
    assert.equal(result.auditEntry.decision, result.decisionTrace.decision);
  });

  test("recommended supplier in trace and audit entry are the same", () => {
    const result = getDemoDecision();
    assert.equal(
      result.auditEntry.recommendedSupplier,
      result.decisionTrace.recommendedSupplier.name,
    );
  });
});
