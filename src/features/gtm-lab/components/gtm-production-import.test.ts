import { describe, expect, it } from "vitest";
import { importValidationSchema, pipelineRunSchema } from "../import-contracts";

describe("GTM production workflow boundaries", () => {
  it("keeps validation authoritative on backend", () => {
    const validation = importValidationSchema.parse({ valid: false, total_rows: 2, valid_rows: 1, invalid_rows: 1, rows: [{ name: "Acme", metadata: {} }], issues: [{ row: 2, field: "name", message: "Field required" }] });
    expect(validation.valid).toBe(false);
    expect(validation.issues[0]?.row).toBe(2);
  });

  it("accepts partial pipeline runs without treating them as transport failures", () => {
    const run = pipelineRunSchema.parse({ run_id: "run-1", status: "PARTIAL", imported_rows: 2, deduplicated_rows: 0, summary: { total_prospects: 2, evaluated_prospects: 1, failed_prospects: 1, total_opportunities: 1, total_evidence: 3, decisions: { PURSUE: 0, RESEARCH: 1, SKIP: 0 } }, prospects: [] });
    expect(run.status).toBe("PARTIAL");
    expect(run.summary.failed_prospects).toBe(1);
  });
});
