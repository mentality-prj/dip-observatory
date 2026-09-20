import { describe, expect, it } from "vitest";
import { importValidationSchema, pipelineRunSchema } from "./import-contracts";

describe("GTM production contracts", () => {
  it("accepts backend import validation", () => {
    expect(importValidationSchema.parse({ valid: true, total_rows: 1, valid_rows: 1, invalid_rows: 0, rows: [{ name: "Acme", metadata: {} }], issues: [] }).rows[0]?.name).toBe("Acme");
  });

  it("accepts pipeline summary without coupling FE to domain internals", () => {
    const parsed = pipelineRunSchema.parse({ run_id: "run-1", status: "COMPLETED", imported_rows: 1, deduplicated_rows: 0, summary: { total_prospects: 1, evaluated_prospects: 1, failed_prospects: 0, total_opportunities: 1, total_evidence: 2, decisions: { PURSUE: 1, RESEARCH: 0, SKIP: 0 } }, prospects: [{ company: { id: "c1", name: "Acme" }, lifecycle: null, problems: [], opportunities: [], decisions: [], evidence_count: 2, error: null }] });
    expect(parsed.summary.decisions.PURSUE).toBe(1);
  });
});
