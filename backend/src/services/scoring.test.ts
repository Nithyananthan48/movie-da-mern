import { describe, expect, it } from "vitest";
import { aggregateScore, normalizeToHundred } from "./scoring.js";

describe("normalizeToHundred", () => {
  it("normalizes values and clamps limits", () => {
    expect(normalizeToHundred(8, 10)).toBe(80);
    expect(normalizeToHundred(120, 100)).toBe(100);
    expect(normalizeToHundred(-2, 10)).toBe(0);
  });
});

describe("aggregateScore", () => {
  it("computes weighted average", () => {
    const result = aggregateScore([
      { rating: { normalizedValue: 90 } as any, source: { weight: 0.6 } as any },
      { rating: { normalizedValue: 70 } as any, source: { weight: 0.4 } as any }
    ]);
    expect(result.score).toBe(82);
    expect(result.voteCount).toBe(2);
  });
});
