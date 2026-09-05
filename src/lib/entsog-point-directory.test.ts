import assert from "node:assert/strict";
import test from "node:test";

import { ENTSOG_POINT_PRESETS } from "@/lib/entsog-point-directory";

test("exports a deterministic static ENTSOG preset list with exact pointDirection values", () => {
  assert.equal(ENTSOG_POINT_PRESETS.length, 8);

  const values = ENTSOG_POINT_PRESETS.map((preset) => preset.value);
  assert.equal(new Set(values).size, values.length);

  const labels = ENTSOG_POINT_PRESETS.map((preset) => preset.label);
  assert.deepEqual(labels, [...labels].sort((a, b) => a.localeCompare(b)));

  assert.deepEqual(ENTSOG_POINT_PRESETS.find((preset) => preset.value === "al-tso-0001itp-00008entry"), {
    value: "al-tso-0001itp-00008entry",
    label: "Melendugno - IT / TAP · TAP · Entry",
    pointLabel: "Melendugno - IT / TAP",
    operatorLabel: "TAP",
    direction: "entry",
    tsoCountry: "CH",
    adjacentCountry: "IT",
  });

  assert.deepEqual(ENTSOG_POINT_PRESETS.find((preset) => preset.value === "al-tso-0001vtp-00044exit"), {
    value: "al-tso-0001vtp-00044exit",
    label: "TAP Virtual Trading Point · TAP · Exit",
    pointLabel: "TAP Virtual Trading Point",
    operatorLabel: "TAP",
    direction: "exit",
    tsoCountry: "CH",
    adjacentCountry: "GR",
  });
});
