import { describe, it, expect } from "vitest";
import { EMOJI_POOL, getEmojisForDifficulty } from "../../src/game/emoji";

describe("emoji", () => {
  it("pool has at least 40 unique emoji", () => {
    expect(EMOJI_POOL.length).toBeGreaterThanOrEqual(40);
    expect(new Set(EMOJI_POOL).size).toBe(EMOJI_POOL.length);
  });

  it("returns correct count for easy", () => {
    const emojis = getEmojisForDifficulty("easy");
    expect(emojis.length).toBe(12);
    expect(new Set(emojis).size).toBe(12);
  });

  it("returns correct count for medium", () => {
    const emojis = getEmojisForDifficulty("medium");
    expect(emojis.length).toBe(24);
  });

  it("returns correct count for hard", () => {
    const emojis = getEmojisForDifficulty("hard");
    expect(emojis.length).toBe(40);
  });

  it("returned emojis are a subset of the pool", () => {
    const emojis = getEmojisForDifficulty("hard");
    for (const e of emojis) {
      expect(EMOJI_POOL).toContain(e);
    }
  });
});
