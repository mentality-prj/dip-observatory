import assert from "node:assert/strict";
import test from "node:test";

import { fetchEntsogPointDirectory } from "@/lib/entsog-point-directory";

const ORIGINAL_FETCH = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
});

test("fetches paginated ENTSOG directory, de-duplicates pointDirection and sorts deterministically", async () => {
  const requestedUrls: string[] = [];

  globalThis.fetch = (async (input) => {
    const url = new URL(String(input));
    requestedUrls.push(url.toString());
    const offset = Number(url.searchParams.get("offset") ?? "0");

    if (offset === 0) {
      return Response.json({
        total: 3,
        operatorpointdirections: [
          {
            pointDirection: "RAW_B",
            pointLabel: "Tarvisio",
            adjacentPointLabel: "Arnoldstein",
            operatorLabel: "TAG",
            directionKey: "exit",
            tsoCountry: "IT",
            adjacentCountry: "AT",
            pointKey: "P2",
            operatorKey: "O2",
          },
          {
            pointDirection: "RAW_A",
            pointLabel: "Kipoi",
            operatorLabel: "TAP",
            directionKey: "entry",
            tsoCountry: "GR",
            pointKey: "P1",
            operatorKey: "O1",
          },
        ],
      });
    }

    if (offset === 1000) {
      return Response.json({
        total: 3,
        operatorpointdirections: [
          {
            pointDirection: "RAW_B",
            pointLabel: "Tarvisio",
            adjacentPointLabel: "Arnoldstein",
            operatorLabel: "TAG",
            directionKey: "exit",
            tsoCountry: "IT",
            adjacentCountry: "AT",
            pointKey: "P2",
            operatorKey: "O2",
          },
        ],
      });
    }

    return Response.json({ total: 3, operatorpointdirections: [] });
  }) as typeof fetch;

  const result = await fetchEntsogPointDirectory();

  assert.equal(result.totalRecords, 3);
  assert.equal(result.retrievedRecords, 3);
  assert.equal(result.duplicatePointDirectionValues, 1);
  assert.equal(result.presets.length, 2);
  assert.deepEqual(
    result.presets.map((preset) => preset.value),
    ["RAW_A", "RAW_B"],
  );
  assert.equal(result.presets[0]?.label, "Kipoi (GR) · TAP · Entry");
  assert.equal(
    result.presets[1]?.label,
    "Tarvisio (IT) → Arnoldstein (AT) · TAG · Exit",
  );
  assert.equal(requestedUrls.length, 3);
  assert.equal(requestedUrls.every((url) => url.includes("hasData=1")), true);
});

test("falls back to conservative label when adjacent point metadata is unavailable", async () => {
  globalThis.fetch = (async () =>
    Response.json({
      operatorpointdirections: [
        {
          pointDirection: "RAW_C",
          pointLabel: "Kipoi",
          operatorLabel: "TAP",
          directionKey: "entry",
          tsoCountry: "GR",
          pointKey: "P3",
          operatorKey: "O3",
        },
      ],
    })) as typeof fetch;

  const result = await fetchEntsogPointDirectory();

  assert.equal(result.presets[0]?.label, "Kipoi (GR) · TAP · Entry");
});
