import assert from "node:assert/strict";
import test from "node:test";
import { importValidationSchema, pipelineRunSchema } from "./import-contracts";

test("accepts backend GTM import validation", () => {
  const parsed = importValidationSchema.parse({ valid: true, total_rows: 1, valid_rows: 1, invalid_rows: 0, rows: [{ name: "Acme", metadata: {} }], issues: [] });
  assert.equal(parsed.rows[0]?.name, "Acme");
});

test("accepts all backend decision states including WATCH", () => {
  const parsed = pipelineRunSchema.parse({ run_id: "run-1", status: "COMPLETED", imported_rows: 1, deduplicated_rows: 0, summary: { total_prospects: 1, evaluated_prospects: 1, failed_prospects: 0, total_opportunities: 0, total_evidence: 0, decisions: { PURSUE: 0, RESEARCH: 0, WATCH: 1, SKIP: 0 } }, prospects: [{ company: { id: "c1", name: "Acme" }, lifecycle: null, problems: [], opportunities: [], decisions: [], evidence_count: 0, error: null }] });
  assert.equal(parsed.summary.decisions.WATCH, 1);
});
