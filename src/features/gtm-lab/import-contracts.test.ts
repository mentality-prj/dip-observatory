import assert from "node:assert/strict";
import test from "node:test";
import { importValidationSchema, pipelineRunSchema } from "./import-contracts";

test("accepts backend GTM import validation", () => {
  const parsed = importValidationSchema.parse({ valid: true, total_rows: 1, valid_rows: 1, invalid_rows: 0, rows: [{ name: "Acme", metadata: {} }], issues: [] });
  assert.equal(parsed.rows[0]?.name, "Acme");
});

test("accepts pipeline summary without coupling FE to domain internals", () => {
  const parsed = pipelineRunSchema.parse({ run_id: "run-1", status: "COMPLETED", imported_rows: 1, deduplicated_rows: 0, summary: { total_prospects: 1, evaluated_prospects: 1, failed_prospects: 0, total_opportunities: 1, total_evidence: 2, decisions: { PURSUE: 1, RESEARCH: 0, SKIP: 0 } }, prospects: [{ company: { id: "c1", name: "Acme" }, lifecycle: null, problems: [], opportunities: [], decisions: [], evidence_count: 2, error: null }] });
  assert.equal(parsed.summary.decisions.PURSUE, 1);
});
