import assert from "node:assert/strict";
import test from "node:test";

import { deriveResearchEvidence } from "./research-evidence";

test("derives failed v0.3 gate without treating disabled procurement as economic success", () => {
  const evidence = deriveResearchEvidence({
    backtest: {
      metrics: [{ model: "baseline_last", mae: 1.799 }],
      raw_ridge_metrics: { model: "ridge", mae: 2.021 },
      magnitude_gate: { fallback_rate: 0.2307 },
      magnitude_variants: { research_gate: "FAIL" },
      leakage_controls: ["training only"],
    },
    procurement: {
      strategy: {
        procurement_eligible: false,
        reason: "magnitude stability gate has not established predictive edge",
      },
    },
  });

  assert.equal(evidence?.researchGate, "FAIL");
  assert.equal(evidence?.procurementEligible, false);
  assert.equal(evidence?.baselineLastMae, 1.799);
  assert.equal(evidence?.ridgeMae, 2.021);
  assert.equal(evidence?.fallbackRate, 0.2307);
});

test("rejects malformed backend evidence instead of guessing defaults", () => {
  assert.equal(deriveResearchEvidence({ backtest: {}, procurement: {} }), null);
  assert.equal(deriveResearchEvidence(null), null);
});
