import { describe, it, expect } from "vitest";
import { calculateMatchScore } from "../../src/game/scoring";

describe("calculateMatchScore", () => {
  it("returns base score with no speed bonus and combo 1", () => {
    const score = calculateMatchScore(10000, 1);
    expect(score).toBe(100);
  });

  it("adds speed bonus for fast match", () => {
    const score = calculateMatchScore(1000, 1);
    expect(score).toBeGreaterThan(100);
    expect(score).toBeLessThanOrEqual(150);
  });

  it("applies combo multiplier", () => {
    const base = calculateMatchScore(10000, 1);
    const combo3 = calculateMatchScore(10000, 3);
    expect(combo3).toBe(base * 3);
  });

  it("combines speed bonus and combo", () => {
    const score = calculateMatchScore(0, 2);
    expect(score).toBe((100 + 50) * 2);
  });

  it("no speed bonus after window expires", () => {
    const score = calculateMatchScore(6000, 1);
    expect(score).toBe(100);
  });
});
