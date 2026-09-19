export type Customer = Record<string, unknown>;

const numericFields = new Set([
  "employee_count",
  "revenue_eur",
  "decision_process_intensity",
  "manual_process_level",
  "data_availability",
  "ai_maturity",
  "problem_evidence_strength",
  "estimated_problem_cost_eur",
  "expected_dip_impact",
  "strategic_fit",
]);

const booleanFields = new Set([
  "existing_decision_system",
  "decision_maker_identified",
  "contact_available",
  "previous_contact",
]);

const requiredFields = [
  "customer_id",
  "company_name",
  "country",
  "industry",
  "problem_evidence_strength",
  "strategic_fit",
] as const;

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }

  values.push(value.trim());
  return values;
}

export function parseCustomerCsv(text: string): Customer[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV must contain a header and at least one customer.");

  const headers = splitCsvLine(lines[0]);
  for (const field of requiredFields) {
    if (!headers.includes(field)) throw new Error(`Missing required column: ${field}`);
  }

  return lines.slice(1).map((line) =>
    Object.fromEntries(
      splitCsvLine(line).map((raw, index) => {
        const key = headers[index];
        if (!key) return [String(index), raw];
        if (raw === "") return [key, null];
        if (numericFields.has(key)) {
          const value = Number(raw);
          if (!Number.isFinite(value)) throw new Error(`Invalid number in ${key}`);
          return [key, value];
        }
        if (booleanFields.has(key)) return [key, raw.toLowerCase() === "true"];
        return [key, raw];
      }),
    ),
  );
}
