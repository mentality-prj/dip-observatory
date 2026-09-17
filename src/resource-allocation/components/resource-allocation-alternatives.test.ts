import { describe, expect, it } from "vitest";

describe("resource allocation alternative display", () => {
  it("keeps tenths of a percentage point visible", () => {
    expect((0.1744 * 100).toFixed(1)).toBe("17.4");
    expect((0.1711 * 100).toFixed(1)).toBe("17.1");
  });
});
