import assert from "node:assert/strict";
import test from "node:test";
import { importValidationSchema, pipelineRunSchema } from "../import-contracts";

test("keeps import validation authoritative on backend", () => {
  const validation = importValidationSchema.parse({ valid: false, total_rows: 2, valid_rows: 1, invalid_rows: 1, rows: [{ name: "Acme", metadata: {} }], issues: [{ row: 2, field: "name", message: "Field required" }] });
  assert.equal(validation.valid_rows, 1);
  assert.equal(validation.invalid_rows, 1);
});

test("preserves partial pipeline success", () => {
  const run = pipelineRunSchema.parse({ run_id: "run-1", status: "PARTIAL", imported_rows: 2, deduplicated_rows: 0, summary: { total_prospects: 2, evaluated_prospects: 1, failed_prospects: 1, total_opportunities: 0, total_evidence: 0, decisions: { PURSUE: 0, RESEARCH: 1, WATCH: 0, SKIP: 0 } }, prospects: [] });
  assert.equal(run.status, "PARTIAL");
  assert.equal(run.summary.failed_prospects, 1);
});
