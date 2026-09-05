import assert from "node:assert/strict";
import test from "node:test";

import {
  ENTSOG_POINT_PRESETS,
  ENTSOG_POINT_PRESET_SOURCE,
  fetchEntsogPointDirectory,
} from "@/lib/entsog-point-directory";

const ORIGINAL_FETCH = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
});

test("returns a checked-in static ENTSOG preset directory without network calls", async () => {
  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return Response.json({});
  }) as typeof fetch;

  const result = await fetchEntsogPointDirectory();

  assert.equal(fetchCalls, 0);
  assert.deepEqual(result.presets, [...ENTSOG_POINT_PRESETS]);
  assert.equal(result.totalRecords, ENTSOG_POINT_PRESET_SOURCE.sourceTotalRecords);
  assert.equal(
    result.retrievedRecords,
    ENTSOG_POINT_PRESET_SOURCE.sourceHasDataRecords,
  );
  assert.equal(result.duplicatePointDirectionValues, 0);
});

test("static presets expose human-readable labels while keeping raw IDs internal", () => {
  assert.ok(ENTSOG_POINT_PRESETS.length > 0);

  for (const preset of ENTSOG_POINT_PRESETS) {
    assert.ok(preset.value.length > 0);
    assert.ok(preset.label.length > 0);
    assert.notEqual(preset.label, preset.value);
    assert.ok(preset.pointLabel.length > 0);
    assert.ok(preset.operatorLabel.length > 0);
    assert.ok(preset.direction.length > 0);
  }
});
