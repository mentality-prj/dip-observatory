/**
 * Scenario lab helpers for supplier decision.
 * Pure deterministic functions for sensitivity analysis and trace diff.
 */
import {
  runSupplierDecisionPlugin,
  DEFAULT_SUPPLIER_CONFIG,
} from "@/supplier/lib/supplier-decision";
import type {
  SupplierDecisionConfig,
  SupplierDecisionResponse,
  SupplierDecisionRequest,
} from "@/supplier/types/supplier-decision";

export interface SupplierSensitivityEntry {
  variable: string;
  level: "HIGH" | "MEDIUM" | "LOW";
  evidence: string;
}

export interface SupplierTraceDiffEntry {
  ruleId: string;
  ruleName: string;
  baselineResult: "PASS" | "FAIL";
  scenarioResult: "PASS" | "FAIL";
  baselineEvidence: string;
  scenarioEvidence: string;
  changed: boolean;
}

export interface SupplierDecisionDelta {
  baselineDecision: string;
  scenarioDecision: string;
  changed: boolean;
  changedReasons: string[];
}

/**
 * Compute sensitivity by perturbing supplier features one at a time.
 */
export function computeSupplierSensitivity(
  baseRequest: SupplierDecisionRequest,
): SupplierSensitivityEntry[] {
  const base = runSupplierDecisionPlugin(baseRequest);
  const baseDecision = base.decisionTrace.decision;

  function decisionChanged(req: SupplierDecisionRequest): boolean {
    const r = runSupplierDecisionPlugin(req);
    return r.decisionTrace.decision !== baseDecision;
  }

  const rec = base.recommendation;
  const escalatedRisk =
    rec.supplier.financialRisk === "LOW"
      ? "MEDIUM"
      : rec.supplier.financialRisk === "MEDIUM"
        ? "HIGH"
        : "HIGH";
  const baselineAlreadyHighRisk = rec.supplier.financialRisk === "HIGH";
  const financialRiskChanged =
    baselineAlreadyHighRisk ||
    decisionChanged({
      ...baseRequest,
      caseId: baseRequest.caseId + "-SEN",
      candidates: baseRequest.candidates.map((s) =>
        s.name === rec.supplier.name ? { ...s, financialRisk: escalatedRisk } : s,
      ),
    });

  const deliveryChanged = decisionChanged({
    ...baseRequest,
    caseId: baseRequest.caseId + "-SEN2",
    candidates: baseRequest.candidates.map((s) =>
      s.name === rec.supplier.name
        ? { ...s, deliveryPerformance: Math.max(0, s.deliveryPerformance - 0.05) }
        : s,
    ),
  });

  const qualityChanged = decisionChanged({
    ...baseRequest,
    caseId: baseRequest.caseId + "-SEN3",
    candidates: baseRequest.candidates.map((s) =>
      s.name === rec.supplier.name
        ? { ...s, qualityScore: Math.max(0, s.qualityScore - 0.03) }
        : s,
    ),
  });

  const baselineAlreadyHighDependency = rec.supplier.dependency >= 0.8;
  const dependencyChanged =
    baselineAlreadyHighDependency ||
    (rec.supplier.dependency < 0.8 &&
      decisionChanged({
        ...baseRequest,
        caseId: baseRequest.caseId + "-SEN4",
        candidates: baseRequest.candidates.map((s) =>
          s.name === rec.supplier.name ? { ...s, dependency: 0.82 } : s,
        ),
      }));

  const complianceChanged =
    rec.supplier.compliant &&
    decisionChanged({
      ...baseRequest,
      caseId: baseRequest.caseId + "-SEN5",
      candidates: baseRequest.candidates.map((s) =>
        s.name === rec.supplier.name ? { ...s, compliant: false } : s,
      ),
    });

  return [
    {
      variable: "Financial risk",
      level: financialRiskChanged ? "HIGH" : "MEDIUM",
      evidence: baselineAlreadyHighRisk
        ? `Financial risk already at HIGH — RULE-05 is actively influencing the decision.`
        : financialRiskChanged
          ? `Escalating financial risk from ${rec.supplier.financialRisk} → ${escalatedRisk} changes the decision.`
          : `Financial risk at ${rec.supplier.financialRisk} — within acceptable range.`,
    },
    {
      variable: "Delivery reliability",
      level: deliveryChanged ? "HIGH" : "MEDIUM",
      evidence: deliveryChanged
        ? "Reducing delivery performance by 5% changes the decision."
        : "Delivery performance within acceptable range — −5% does not change the decision.",
    },
    {
      variable: "Quality score",
      level: qualityChanged ? "HIGH" : "MEDIUM",
      evidence: qualityChanged
        ? "Reducing quality score by 3% changes the decision."
        : "Quality score within acceptable range — −3% does not change the decision.",
    },
    {
      variable: "Supplier dependency",
      level: baselineAlreadyHighDependency ? "HIGH" : dependencyChanged ? "MEDIUM" : "LOW",
      evidence: baselineAlreadyHighDependency
        ? `Supplier dependency at ${(rec.supplier.dependency * 100).toFixed(0)}% — already above the 80% high-concentration threshold.`
        : dependencyChanged
          ? "Increasing dependency above 80% changes the decision."
          : "Dependency below high-concentration threshold.",
    },
    {
      variable: "Compliance status",
      level: complianceChanged ? "HIGH" : "LOW",
      evidence: complianceChanged
        ? "Removing compliance certification changes the decision (blocking rule)."
        : "Compliance certification valid — removal would trigger blocking rule.",
    },
  ];
}

/**
 * Compute rule-level trace diff between baseline and scenario.
 */
export function computeSupplierTraceDiff(
  baseline: SupplierDecisionResponse,
  scenario: SupplierDecisionResponse,
): SupplierTraceDiffEntry[] {
  const baseRec = baseline.recommendation;
  const scenRec = scenario.recommendation;

  const ruleIds = [
    ...new Set([
      ...baseRec.ruleResults.map((r) => r.rule.id),
      ...scenRec.ruleResults.map((r) => r.rule.id),
    ]),
  ];

  return ruleIds.map((ruleId) => {
    const bRule = baseRec.ruleResults.find((r) => r.rule.id === ruleId);
    const sRule = scenRec.ruleResults.find((r) => r.rule.id === ruleId);
    const bResult: "PASS" | "FAIL" = bRule?.passed ? "PASS" : "FAIL";
    const sResult: "PASS" | "FAIL" = sRule?.passed ? "PASS" : "FAIL";
    return {
      ruleId,
      ruleName: bRule?.rule.name ?? sRule?.rule.name ?? ruleId,
      baselineResult: bResult,
      scenarioResult: sResult,
      baselineEvidence: bRule?.evidence ?? "—",
      scenarioEvidence: sRule?.evidence ?? "—",
      changed: bResult !== sResult,
    };
  });
}

/**
 * Compute policy impact: how many candidates change decision when config changes.
 */
export function computeSupplierPolicyImpact(
  baseRequest: SupplierDecisionRequest,
  newConfig: Partial<SupplierDecisionConfig>,
): { affectedSuppliers: number; decisionChanges: number } {
  const fullNewConfig = {
    ...DEFAULT_SUPPLIER_CONFIG,
    ...baseRequest.configuration,
    ...newConfig,
  };
  let affectedSuppliers = 0;
  let decisionChanges = 0;

  for (const supplier of baseRequest.candidates) {
    const singleReq: SupplierDecisionRequest = {
      ...baseRequest,
      caseId: baseRequest.caseId + "-POLICY",
      candidates: [supplier],
    };
    const baseResult = runSupplierDecisionPlugin({
      ...singleReq,
      configuration: baseRequest.configuration,
    });
    const scenResult = runSupplierDecisionPlugin({
      ...singleReq,
      configuration: fullNewConfig,
    });

    if (baseResult.decisionTrace.decision !== scenResult.decisionTrace.decision) {
      decisionChanges++;
    }
    // A supplier is "affected" if any rule result changed, even if the final decision didn't
    const ruleChanged = baseResult.recommendation.ruleResults.some((bRule) => {
      const sRule = scenResult.recommendation.ruleResults.find(
        (r) => r.rule.id === bRule.rule.id,
      );
      return sRule && sRule.passed !== bRule.passed;
    });
    if (ruleChanged) {
      affectedSuppliers++;
    }
  }

  return { affectedSuppliers, decisionChanges };
}
