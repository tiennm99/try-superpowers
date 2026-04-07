import { describe, it, expect } from "vitest";
import { createBoard, getRemainingTiles, shuffleBoard } from "../../src/game/board";

describe("createBoard", () => {
  it("creates a board with correct dimensions for easy", () => {
    const board = createBoard("easy");
    expect(board.length).toBe(4);
    expect(board[0].length).toBe(6);
  });

  it("creates a board with correct dimensions for medium", () => {
    const board = createBoard("medium");
    expect(board.length).toBe(6);
    expect(board[0].length).toBe(8);
  });

  it("creates a board with correct dimensions for hard", () => {
    const board = createBoard("hard");
    expect(board.length).toBe(8);
    expect(board[0].length).toBe(10);
  });

  it("every tile has a matching pair", () => {
    const board = createBoard("easy");
    const emojiCounts = new Map<string, number>();
    for (const row of board) {
      for (const cell of row) {
        if (cell) {
          emojiCounts.set(cell.emoji, (emojiCounts.get(cell.emoji) ?? 0) + 1);
        }
      }
    }
    for (const [, count] of emojiCounts) {
      expect(count).toBe(2);
    }
  });

  it("all tiles have unique ids", () => {
    const board = createBoard("medium");
    const ids = new Set<number>();
    for (const row of board) {
      for (const cell of row) {
        if (cell) {
          expect(ids.has(cell.id)).toBe(false);
          ids.add(cell.id);
        }
      }
    }
  });
});

describe("getRemainingTiles", () => {
  it("returns all tiles from a full board", () => {
    const board = createBoard("easy");
    const remaining = getRemainingTiles(board);
    expect(remaining.length).toBe(24);
  });

  it("excludes null cells", () => {
    const board = createBoard("easy");
    board[0][0] = null;
    board[0][1] = null;
    const remaining = getRemainingTiles(board);
    expect(remaining.length).toBe(22);
  });
});

describe("shuffleBoard", () => {
  it("preserves tile count after shuffle", () => {
    const board = createBoard("easy");
    board[0][0] = null;
    board[0][1] = null;
    const shuffled = shuffleBoard(board);
    const remaining = getRemainingTiles(shuffled);
    expect(remaining.length).toBe(22);
  });

  it("keeps null positions as occupied cells and vice versa", () => {
    const board = createBoard("easy");
    board[0][0] = null;
    board[1][2] = null;
    const shuffled = shuffleBoard(board);
    let nullCount = 0;
    for (const row of shuffled) {
      for (const cell of row) {
        if (cell === null) nullCount++;
      }
    }
    expect(nullCount).toBe(2);
  });
});
