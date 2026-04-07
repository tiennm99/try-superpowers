import { describe, it, expect } from "vitest";
import { findPath, hasAnyValidMove } from "../../src/game/pathfinder";
import { Board } from "../../src/types";

function makeBoard(grid: (string | null)[][]): Board {
  let id = 0;
  return grid.map((row) =>
    row.map((cell) => (cell !== null ? { emoji: cell, id: id++ } : null))
  );
}

describe("findPath", () => {
  it("finds direct horizontal connection", () => {
    const board = makeBoard([
      ["A", null, "A"],
    ]);
    const path = findPath(board, { row: 0, col: 0 }, { row: 0, col: 2 });
    expect(path).not.toBeNull();
    expect(path!.length).toBe(2);
  });

  it("finds direct vertical connection", () => {
    const board = makeBoard([
      ["A"],
      [null],
      ["A"],
    ]);
    const path = findPath(board, { row: 0, col: 0 }, { row: 2, col: 0 });
    expect(path).not.toBeNull();
    expect(path!.length).toBe(2);
  });

  it("finds one-bend connection", () => {
    const board = makeBoard([
      ["A", null],
      [null, "A"],
    ]);
    const path = findPath(board, { row: 0, col: 0 }, { row: 1, col: 1 });
    expect(path).not.toBeNull();
    expect(path!.length).toBe(3);
  });

  it("finds two-bend connection", () => {
    const board = makeBoard([
      ["A", "B", null],
      [null, null, null],
      [null, "B", "A"],
    ]);
    const path = findPath(board, { row: 0, col: 0 }, { row: 2, col: 2 });
    expect(path).not.toBeNull();
    expect(path!.length).toBe(4);
  });

  it("returns null when no valid path exists", () => {
    const board = makeBoard([
      ["A", "B", "C"],
      ["D", "E", "F"],
      ["C", "B", "A"],
    ]);
    const path = findPath(board, { row: 0, col: 0 }, { row: 2, col: 2 });
    expect(path).toBeNull();
  });

  it("returns null when tiles are not the same emoji", () => {
    const board = makeBoard([
      ["A", null, "B"],
    ]);
    const path = findPath(board, { row: 0, col: 0 }, { row: 0, col: 2 });
    expect(path).toBeNull();
  });

  it("finds path through border (empty surround)", () => {
    const board = makeBoard([
      ["A", "B", "A"],
    ]);
    const path = findPath(board, { row: 0, col: 0 }, { row: 0, col: 2 });
    expect(path).not.toBeNull();
  });

  it("adjacent identical tiles connect", () => {
    const board = makeBoard([
      ["A", "A"],
    ]);
    const path = findPath(board, { row: 0, col: 0 }, { row: 0, col: 1 });
    expect(path).not.toBeNull();
    expect(path!.length).toBe(2);
  });
});

describe("hasAnyValidMove", () => {
  it("returns true when moves exist", () => {
    const board = makeBoard([
      ["A", "A"],
    ]);
    expect(hasAnyValidMove(board)).toBe(true);
  });

  it("returns false when no moves exist", () => {
    const board = makeBoard([
      ["A", "B"],
      ["C", "D"],
    ]);
    expect(hasAnyValidMove(board)).toBe(false);
  });

  it("returns false for empty board", () => {
    const board = makeBoard([
      [null, null],
      [null, null],
    ]);
    expect(hasAnyValidMove(board)).toBe(false);
  });
});
