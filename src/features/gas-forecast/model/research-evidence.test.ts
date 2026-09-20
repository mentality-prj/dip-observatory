import assert from "node:assert/strict";
import test from "node:test";

import { deriveResearchEvidence, V04_PROTOCOL } from "./research-evidence";

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

test("v0.4 protocol makes economic decision metrics primary", () => {
  assert.equal(V04_PROTOCOL.version, "v0.4");
  assert.equal(V04_PROTOCOL.primaryMetrics[0], "Cost €/MWh");
  assert.ok(V04_PROTOCOL.diagnosticMetrics.includes("MAE"));
  assert.deepEqual(V04_PROTOCOL.alternatives, ["BUY NOW", "WAIT"]);
});
