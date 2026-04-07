# Pikachu Onet Connect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based Pikachu Onet Connect tile-matching game with multiple difficulties, timer, scoring, hints, and shuffle.

**Architecture:** React 18 shell wraps a Phaser 3 game board. A shared EventEmitter-based state manager bridges them. Pure game logic (board generation, pathfinding) lives in standalone TypeScript modules with full test coverage.

**Tech Stack:** React 18, Vite, Phaser 3, TypeScript, Vitest

---

## File Structure

```
src/
  types/index.ts              # Shared types (Difficulty, Point, GameStatus, etc.)
  game/emoji.ts               # Emoji pool and difficulty-based subset selection
  game/board.ts               # Board generation, tile placement, shuffle
  game/pathfinder.ts          # Connection validation (≤3 line segments)
  game/scoring.ts             # Score calculation (base + speed + combo)
  game/state.ts               # Shared state manager (EventEmitter pattern)
  game/constants.ts           # Difficulty configs (board size, timer, hints, shuffles)
  phaser/config.ts            # Phaser game configuration factory
  phaser/scenes/PreloadScene.ts
  phaser/scenes/GameScene.ts  # Main game scene (board render, input, animations)
  components/App.tsx           # Root component, screen routing
  components/Menu.tsx          # Main menu screen
  components/DifficultySelect.tsx
  components/GameContainer.tsx # Phaser-React bridge
  components/HUD.tsx           # Timer, score, hint/shuffle buttons
  components/GameOver.tsx      # Win/lose screen
  components/Toast.tsx         # Auto-shuffle notification
  main.tsx                     # Entry point
  index.css                    # Global styles
tests/
  game/board.test.ts
  game/pathfinder.test.ts
  game/scoring.test.ts
  game/state.test.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/components/App.tsx`, `src/index.css`

- [ ] **Step 1: Scaffold Vite + React + TypeScript project**

```bash
npm create vite@latest . -- --template react-ts
```

Select "Ignore files and continue" if prompted about existing files.

- [ ] **Step 2: Install dependencies**

```bash
npm install phaser
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Vitest in `vite.config.ts`**

Replace the contents of `vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
  },
});
```

- [ ] **Step 4: Replace `src/App.tsx` with minimal placeholder**

```tsx
function App() {
  return <div>Pikachu Onet Connect</div>;
}

export default App;
```

- [ ] **Step 5: Clean up scaffolded files**

Delete `src/App.css`, `src/assets/react.svg`, `public/vite.svg`. Replace `src/index.css` with:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background: #1a1a2e;
  color: #e0e0e0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

#root {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: Browser shows "Pikachu Onet Connect" on dark background.

- [ ] **Step 7: Verify tests run**

```bash
npx vitest run
```

Expected: No test files found (or passes with 0 tests). No errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TS project with Phaser and Vitest"
```

---

### Task 2: Types and Constants

**Files:**
- Create: `src/types/index.ts`, `src/game/constants.ts`

- [ ] **Step 1: Create shared types in `src/types/index.ts`**

```ts
export type Difficulty = "easy" | "medium" | "hard";

export interface Point {
  row: number;
  col: number;
}

export type GameStatus = "menu" | "playing" | "paused" | "won" | "lost";

export interface DifficultyConfig {
  rows: number;
  cols: number;
  timerSeconds: number;
  hints: number;
  shuffles: number;
  pairCount: number;
}

export interface TileData {
  emoji: string;
  id: number;
}

export type Board = (TileData | null)[][];
```

- [ ] **Step 2: Create constants in `src/game/constants.ts`**

```ts
import { Difficulty, DifficultyConfig } from "../types";

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    rows: 4,
    cols: 6,
    timerSeconds: 300,
    hints: 5,
    shuffles: 3,
    pairCount: 12,
  },
  medium: {
    rows: 6,
    cols: 8,
    timerSeconds: 240,
    hints: 3,
    shuffles: 2,
    pairCount: 24,
  },
  hard: {
    rows: 8,
    cols: 10,
    timerSeconds: 180,
    hints: 1,
    shuffles: 1,
    pairCount: 40,
  },
};

export const BASE_MATCH_SCORE = 100;
export const SPEED_BONUS_MAX = 50;
export const SPEED_BONUS_WINDOW_MS = 5000;
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/game/constants.ts
git commit -m "feat: add shared types and difficulty constants"
```

---

### Task 3: Emoji Set Module

**Files:**
- Create: `src/game/emoji.ts`, `tests/game/emoji.test.ts`

- [ ] **Step 1: Write tests in `tests/game/emoji.test.ts`**

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/game/emoji.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/game/emoji.ts`**

```ts
import { Difficulty } from "../types";
import { DIFFICULTY_CONFIGS } from "./constants";

export const EMOJI_POOL: string[] = [
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
  "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔",
  "🐧", "🐦", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗",
  "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐢",
  "🐍", "🦎", "🐙", "🦑", "🦐", "🦀", "🐡", "🐠",
  "🐟", "🐬", "🐳", "🐊",
];

export function getEmojisForDifficulty(difficulty: Difficulty): string[] {
  const count = DIFFICULTY_CONFIGS[difficulty].pairCount;
  const shuffled = [...EMOJI_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/game/emoji.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/emoji.ts tests/game/emoji.test.ts
git commit -m "feat: add emoji pool and difficulty-based selection"
```

---

### Task 4: Board Generation

**Files:**
- Create: `src/game/board.ts`, `tests/game/board.test.ts`

- [ ] **Step 1: Write tests in `tests/game/board.test.ts`**

```ts
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
    // Same number of nulls
    let nullCount = 0;
    for (const row of shuffled) {
      for (const cell of row) {
        if (cell === null) nullCount++;
      }
    }
    expect(nullCount).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/game/board.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/game/board.ts`**

```ts
import { Board, Difficulty, TileData, Point } from "../types";
import { DIFFICULTY_CONFIGS } from "./constants";
import { getEmojisForDifficulty } from "./emoji";

let nextTileId = 0;

export function createBoard(difficulty: Difficulty): Board {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const { rows, cols } = config;
  const emojis = getEmojisForDifficulty(difficulty);

  // Create pairs
  const tiles: TileData[] = [];
  nextTileId = 0;
  for (const emoji of emojis) {
    tiles.push({ emoji, id: nextTileId++ });
    tiles.push({ emoji, id: nextTileId++ });
  }

  // Fisher-Yates shuffle
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  // Place into grid
  const board: Board = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    const row: (TileData | null)[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(tiles[idx++]);
    }
    board.push(row);
  }

  return board;
}

export function getRemainingTiles(board: Board): { tile: TileData; pos: Point }[] {
  const result: { tile: TileData; pos: Point }[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const cell = board[r][c];
      if (cell !== null) {
        result.push({ tile: cell, pos: { row: r, col: c } });
      }
    }
  }
  return result;
}

export function shuffleBoard(board: Board): Board {
  const rows = board.length;
  const cols = board[0].length;

  // Collect remaining tiles and empty positions
  const tiles: TileData[] = [];
  const occupiedPositions: Point[] = [];
  const emptyPositions: Point[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] !== null) {
        tiles.push(board[r][c]!);
        occupiedPositions.push({ row: r, col: c });
      } else {
        emptyPositions.push({ row: r, col: c });
      }
    }
  }

  // Fisher-Yates shuffle the tiles
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  // Create new board with nulls
  const newBoard: Board = [];
  for (let r = 0; r < rows; r++) {
    newBoard.push(new Array(cols).fill(null));
  }

  // Place shuffled tiles back into occupied positions
  for (let i = 0; i < tiles.length; i++) {
    const pos = occupiedPositions[i];
    newBoard[pos.row][pos.col] = tiles[i];
  }

  return newBoard;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/game/board.test.ts
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/board.ts tests/game/board.test.ts
git commit -m "feat: add board generation, remaining tiles, and shuffle"
```

---

### Task 5: Pathfinder

**Files:**
- Create: `src/game/pathfinder.ts`, `tests/game/pathfinder.test.ts`

- [ ] **Step 1: Write tests in `tests/game/pathfinder.test.ts`**

```ts
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
    expect(path!.length).toBe(2); // start + end
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
    expect(path!.length).toBe(3); // start, corner, end
  });

  it("finds two-bend connection", () => {
    const board = makeBoard([
      ["A", "B", null],
      [null, null, null],
      [null, "B", "A"],
    ]);
    const path = findPath(board, { row: 0, col: 0 }, { row: 2, col: 2 });
    expect(path).not.toBeNull();
    expect(path!.length).toBe(4); // start, bend1, bend2, end
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
    // Board is conceptually surrounded by empty border
    // Two tiles on same row, blocked between, but can go via border
    const board = makeBoard([
      ["A", "B", "A"],
    ]);
    // Path: (0,0) -> up to border row -1 -> across -> down to (0,2)
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
    // All unique — no matching pairs
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/game/pathfinder.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/game/pathfinder.ts`**

```ts
import { Board, Point } from "../types";

/**
 * Check if a cell is empty (null) or is in the virtual border surrounding the board.
 * Border cells are at row = -1, row = rows, col = -1, col = cols.
 */
function isEmpty(board: Board, row: number, col: number): boolean {
  const rows = board.length;
  const cols = board[0].length;
  // Border cells are always empty
  if (row < 0 || row >= rows || col < 0 || col >= cols) {
    return row >= -1 && row <= rows && col >= -1 && col <= cols;
  }
  return board[row][col] === null;
}

const DIRS: [number, number][] = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

/**
 * Get all cells reachable from (row, col) in a straight line in one direction.
 * Includes the starting point.
 */
function raycast(
  board: Board,
  row: number,
  col: number,
  dr: number,
  dc: number
): Point[] {
  const points: Point[] = [];
  let r = row + dr;
  let c = col + dc;
  const rows = board.length;
  const cols = board[0].length;
  while (r >= -1 && r <= rows && c >= -1 && c <= cols && isEmpty(board, r, c)) {
    points.push({ row: r, col: c });
    r += dr;
    c += dc;
  }
  return points;
}

/**
 * Check if two points can be connected by a straight line through empty cells.
 */
function canConnectStraight(
  board: Board,
  a: Point,
  b: Point
): boolean {
  if (a.row === b.row) {
    const minC = Math.min(a.col, b.col);
    const maxC = Math.max(a.col, b.col);
    for (let c = minC + 1; c < maxC; c++) {
      if (!isEmpty(board, a.row, c)) return false;
    }
    return true;
  }
  if (a.col === b.col) {
    const minR = Math.min(a.row, b.row);
    const maxR = Math.max(a.row, b.row);
    for (let r = minR + 1; r < maxR; r++) {
      if (!isEmpty(board, r, a.col)) return false;
    }
    return true;
  }
  return false;
}

/**
 * Find a path between two tiles with at most 2 bends (3 line segments).
 * Returns array of points forming the path, or null if no valid path exists.
 * The path includes the start and end tile positions.
 */
export function findPath(
  board: Board,
  a: Point,
  b: Point
): Point[] | null {
  // Tiles must be the same emoji
  const tileA = board[a.row]?.[a.col];
  const tileB = board[b.row]?.[b.col];
  if (!tileA || !tileB || tileA.emoji !== tileB.emoji) return null;
  if (a.row === b.row && a.col === b.col) return null;

  // 0 bends: direct straight line
  if (canConnectStraight(board, a, b)) {
    return [a, b];
  }

  // 1 bend: check two possible corners
  const corner1: Point = { row: a.row, col: b.col };
  if (
    isEmpty(board, corner1.row, corner1.col) &&
    canConnectStraight(board, a, corner1) &&
    canConnectStraight(board, corner1, b)
  ) {
    return [a, corner1, b];
  }

  const corner2: Point = { row: b.row, col: a.col };
  if (
    isEmpty(board, corner2.row, corner2.col) &&
    canConnectStraight(board, a, corner2) &&
    canConnectStraight(board, corner2, b)
  ) {
    return [a, corner2, b];
  }

  // 2 bends: try all lines from A, for each reachable cell, try 1-bend to B
  for (const [dr, dc] of DIRS) {
    const reachable = raycast(board, a.row, a.col, dr, dc);
    for (const mid of reachable) {
      // From mid, try 1-bend connection to B
      const cornerA: Point = { row: mid.row, col: b.col };
      if (
        isEmpty(board, cornerA.row, cornerA.col) &&
        canConnectStraight(board, mid, cornerA) &&
        canConnectStraight(board, cornerA, b)
      ) {
        return [a, mid, cornerA, b];
      }

      const cornerB: Point = { row: b.row, col: mid.col };
      if (
        isEmpty(board, cornerB.row, cornerB.col) &&
        canConnectStraight(board, mid, cornerB) &&
        canConnectStraight(board, cornerB, b)
      ) {
        return [a, mid, cornerB, b];
      }

      // Also check direct straight from mid to B
      if (canConnectStraight(board, mid, b)) {
        return [a, mid, b];
      }
    }
  }

  return null;
}

/**
 * Check if any valid move exists on the board.
 */
export function hasAnyValidMove(board: Board): boolean {
  const tiles: { pos: Point; emoji: string }[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] !== null) {
        tiles.push({ pos: { row: r, col: c }, emoji: board[r][c]!.emoji });
      }
    }
  }

  // Group by emoji
  const groups = new Map<string, Point[]>();
  for (const t of tiles) {
    if (!groups.has(t.emoji)) groups.set(t.emoji, []);
    groups.get(t.emoji)!.push(t.pos);
  }

  for (const [, positions] of groups) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (findPath(board, positions[i], positions[j]) !== null) {
          return true;
        }
      }
    }
  }

  return false;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/game/pathfinder.test.ts
```

Expected: All 11 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/pathfinder.ts tests/game/pathfinder.test.ts
git commit -m "feat: add pathfinder with ≤2 bend connection validation"
```

---

### Task 6: Scoring Module

**Files:**
- Create: `src/game/scoring.ts`, `tests/game/scoring.test.ts`

- [ ] **Step 1: Write tests in `tests/game/scoring.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { calculateMatchScore } from "../../src/game/scoring";

describe("calculateMatchScore", () => {
  it("returns base score with no speed bonus and combo 1", () => {
    const score = calculateMatchScore(10000, 1);
    expect(score).toBe(100);
  });

  it("adds speed bonus for fast match", () => {
    const score = calculateMatchScore(1000, 1); // 1 second since last match
    expect(score).toBeGreaterThan(100);
    expect(score).toBeLessThanOrEqual(150);
  });

  it("applies combo multiplier", () => {
    const base = calculateMatchScore(10000, 1);
    const combo3 = calculateMatchScore(10000, 3);
    expect(combo3).toBe(base * 3);
  });

  it("combines speed bonus and combo", () => {
    const score = calculateMatchScore(0, 2); // instant match, combo 2
    expect(score).toBe((100 + 50) * 2); // (base + max speed) * combo
  });

  it("no speed bonus after window expires", () => {
    const score = calculateMatchScore(6000, 1); // 6 seconds — beyond 5s window
    expect(score).toBe(100);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/game/scoring.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/game/scoring.ts`**

```ts
import { BASE_MATCH_SCORE, SPEED_BONUS_MAX, SPEED_BONUS_WINDOW_MS } from "./constants";

/**
 * Calculate the score for a match.
 * @param msSinceLastMatch - milliseconds since the previous match (or game start)
 * @param combo - current combo streak (1 = no streak)
 */
export function calculateMatchScore(
  msSinceLastMatch: number,
  combo: number
): number {
  let speedBonus = 0;
  if (msSinceLastMatch < SPEED_BONUS_WINDOW_MS) {
    const ratio = 1 - msSinceLastMatch / SPEED_BONUS_WINDOW_MS;
    speedBonus = Math.round(SPEED_BONUS_MAX * ratio);
  }

  return (BASE_MATCH_SCORE + speedBonus) * combo;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/game/scoring.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/scoring.ts tests/game/scoring.test.ts
git commit -m "feat: add score calculation with speed bonus and combo"
```

---

### Task 7: Shared State Manager

**Files:**
- Create: `src/game/state.ts`, `tests/game/state.test.ts`

- [ ] **Step 1: Write tests in `tests/game/state.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GameStateManager } from "../../src/game/state";

describe("GameStateManager", () => {
  let state: GameStateManager;

  beforeEach(() => {
    state = new GameStateManager();
  });

  it("initializes with menu status", () => {
    expect(state.getState().status).toBe("menu");
  });

  it("startGame sets state for given difficulty", () => {
    state.startGame("easy");
    const s = state.getState();
    expect(s.status).toBe("playing");
    expect(s.score).toBe(0);
    expect(s.hintsRemaining).toBe(5);
    expect(s.shufflesRemaining).toBe(3);
    expect(s.timerSeconds).toBe(300);
    expect(s.difficulty).toBe("easy");
    expect(s.combo).toBe(1);
  });

  it("addScore increases score", () => {
    state.startGame("easy");
    state.addScore(150);
    expect(state.getState().score).toBe(150);
    state.addScore(100);
    expect(state.getState().score).toBe(250);
  });

  it("useHint decrements hints", () => {
    state.startGame("easy");
    expect(state.useHint()).toBe(true);
    expect(state.getState().hintsRemaining).toBe(4);
  });

  it("useHint returns false when no hints left", () => {
    state.startGame("hard"); // 1 hint
    expect(state.useHint()).toBe(true);
    expect(state.useHint()).toBe(false);
    expect(state.getState().hintsRemaining).toBe(0);
  });

  it("useShuffle decrements shuffles", () => {
    state.startGame("easy");
    expect(state.useShuffle()).toBe(true);
    expect(state.getState().shufflesRemaining).toBe(2);
  });

  it("useShuffle returns false when no shuffles left", () => {
    state.startGame("hard"); // 1 shuffle
    expect(state.useShuffle()).toBe(true);
    expect(state.useShuffle()).toBe(false);
  });

  it("tick decrements timer", () => {
    state.startGame("easy");
    state.tick();
    expect(state.getState().timerSeconds).toBe(299);
  });

  it("tick sets status to lost when timer reaches 0", () => {
    state.startGame("easy");
    // Fast forward to 1 second left
    for (let i = 0; i < 300; i++) {
      state.tick();
    }
    expect(state.getState().status).toBe("lost");
    expect(state.getState().timerSeconds).toBe(0);
  });

  it("emits events on state change", () => {
    const listener = vi.fn();
    state.on("stateChange", listener);
    state.startGame("easy");
    expect(listener).toHaveBeenCalled();
  });

  it("incrementCombo and resetCombo work", () => {
    state.startGame("easy");
    state.incrementCombo();
    expect(state.getState().combo).toBe(2);
    state.incrementCombo();
    expect(state.getState().combo).toBe(3);
    state.resetCombo();
    expect(state.getState().combo).toBe(1);
  });

  it("setStatus changes status and emits", () => {
    state.startGame("easy");
    const listener = vi.fn();
    state.on("stateChange", listener);
    state.setStatus("won");
    expect(state.getState().status).toBe("won");
    expect(listener).toHaveBeenCalled();
  });

  it("pause and resume toggle status", () => {
    state.startGame("easy");
    state.setStatus("paused");
    expect(state.getState().status).toBe("paused");
    state.setStatus("playing");
    expect(state.getState().status).toBe("playing");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/game/state.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/game/state.ts`**

```ts
import { Difficulty, GameStatus } from "../types";
import { DIFFICULTY_CONFIGS } from "./constants";

type Listener = () => void;

interface GameState {
  status: GameStatus;
  difficulty: Difficulty | null;
  score: number;
  timerSeconds: number;
  hintsRemaining: number;
  shufflesRemaining: number;
  combo: number;
  lastMatchTime: number;
}

export class GameStateManager {
  private state: GameState;
  private listeners: Map<string, Listener[]> = new Map();

  constructor() {
    this.state = {
      status: "menu",
      difficulty: null,
      score: 0,
      timerSeconds: 0,
      hintsRemaining: 0,
      shufflesRemaining: 0,
      combo: 1,
      lastMatchTime: 0,
    };
  }

  getState(): Readonly<GameState> {
    return { ...this.state };
  }

  on(event: string, listener: Listener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: Listener): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    }
  }

  private emit(event: string): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const l of listeners) l();
    }
  }

  startGame(difficulty: Difficulty): void {
    const config = DIFFICULTY_CONFIGS[difficulty];
    this.state = {
      status: "playing",
      difficulty,
      score: 0,
      timerSeconds: config.timerSeconds,
      hintsRemaining: config.hints,
      shufflesRemaining: config.shuffles,
      combo: 1,
      lastMatchTime: Date.now(),
    };
    this.emit("stateChange");
  }

  addScore(points: number): void {
    this.state.score += points;
    this.emit("stateChange");
  }

  useHint(): boolean {
    if (this.state.hintsRemaining <= 0) return false;
    this.state.hintsRemaining--;
    this.emit("stateChange");
    return true;
  }

  useShuffle(): boolean {
    if (this.state.shufflesRemaining <= 0) return false;
    this.state.shufflesRemaining--;
    this.emit("stateChange");
    return true;
  }

  tick(): void {
    if (this.state.status !== "playing") return;
    this.state.timerSeconds--;
    if (this.state.timerSeconds <= 0) {
      this.state.timerSeconds = 0;
      this.state.status = "lost";
    }
    this.emit("stateChange");
  }

  incrementCombo(): void {
    this.state.combo++;
    this.emit("stateChange");
  }

  resetCombo(): void {
    this.state.combo = 1;
    this.emit("stateChange");
  }

  setStatus(status: GameStatus): void {
    this.state.status = status;
    this.emit("stateChange");
  }

  setLastMatchTime(time: number): void {
    this.state.lastMatchTime = time;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/game/state.test.ts
```

Expected: All 13 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/state.ts tests/game/state.test.ts
git commit -m "feat: add shared game state manager with EventEmitter"
```

---

### Task 8: Phaser Configuration and PreloadScene

**Files:**
- Create: `src/phaser/config.ts`, `src/phaser/scenes/PreloadScene.ts`

- [ ] **Step 1: Create Phaser config factory in `src/phaser/config.ts`**

```ts
import Phaser from "phaser";
import { PreloadScene } from "./scenes/PreloadScene";
import { GameScene } from "./scenes/GameScene";

export function createPhaserConfig(
  parent: HTMLElement,
  width: number,
  height: number
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width,
    height,
    backgroundColor: "#16213e",
    scene: [PreloadScene, GameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };
}
```

- [ ] **Step 2: Create PreloadScene in `src/phaser/scenes/PreloadScene.ts`**

```ts
import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloadScene" });
  }

  preload(): void {
    // No assets to load — emoji are rendered as text
  }

  create(): void {
    this.scene.start("GameScene");
  }
}
```

- [ ] **Step 3: Create a stub `src/phaser/scenes/GameScene.ts`**

```ts
import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY, "Game Loading...", {
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/phaser/config.ts src/phaser/scenes/PreloadScene.ts src/phaser/scenes/GameScene.ts
git commit -m "feat: add Phaser config factory, PreloadScene, and GameScene stub"
```

---

### Task 9: React Shell — Menu and Difficulty Select

**Files:**
- Create: `src/components/Menu.tsx`, `src/components/DifficultySelect.tsx`
- Modify: `src/components/App.tsx`

- [ ] **Step 1: Create `src/components/Menu.tsx`**

```tsx
interface MenuProps {
  onPlay: () => void;
}

export function Menu({ onPlay }: MenuProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "24px",
    }}>
      <h1 style={{ fontSize: "48px" }}>⚡ Pikachu Onet Connect</h1>
      <p style={{ fontSize: "18px", color: "#aaa" }}>
        Match pairs of tiles by connecting them with up to 3 lines
      </p>
      <button
        onClick={onPlay}
        style={{
          padding: "16px 48px",
          fontSize: "24px",
          background: "#e94560",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Play
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/DifficultySelect.tsx`**

```tsx
import { Difficulty } from "../types";

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void;
  onBack: () => void;
}

const difficulties: { key: Difficulty; label: string; desc: string }[] = [
  { key: "easy", label: "Easy", desc: "6×4 grid • 5 min • 5 hints" },
  { key: "medium", label: "Medium", desc: "8×6 grid • 4 min • 3 hints" },
  { key: "hard", label: "Hard", desc: "10×8 grid • 3 min • 1 hint" },
];

export function DifficultySelect({ onSelect, onBack }: DifficultySelectProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "20px",
    }}>
      <h2 style={{ fontSize: "32px" }}>Select Difficulty</h2>
      <div style={{ display: "flex", gap: "16px" }}>
        {difficulties.map((d) => (
          <button
            key={d.key}
            onClick={() => onSelect(d.key)}
            style={{
              padding: "20px 32px",
              fontSize: "18px",
              background: "#0f3460",
              color: "#fff",
              border: "2px solid #e94560",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <strong>{d.label}</strong>
            <span style={{ fontSize: "12px", color: "#aaa" }}>{d.desc}</span>
          </button>
        ))}
      </div>
      <button
        onClick={onBack}
        style={{
          padding: "8px 24px",
          fontSize: "16px",
          background: "transparent",
          color: "#aaa",
          border: "1px solid #aaa",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Back
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Update `src/components/App.tsx` with screen routing**

```tsx
import { useState, useRef } from "react";
import { Difficulty } from "../types";
import { GameStateManager } from "../game/state";
import { Menu } from "./Menu";
import { DifficultySelect } from "./DifficultySelect";

type Screen = "menu" | "difficulty" | "game" | "gameover";

function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const stateManager = useRef(new GameStateManager()).current;

  const handleSelectDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    stateManager.startGame(d);
    setScreen("game");
  };

  return (
    <div style={{ textAlign: "center" }}>
      {screen === "menu" && (
        <Menu onPlay={() => setScreen("difficulty")} />
      )}
      {screen === "difficulty" && (
        <DifficultySelect
          onSelect={handleSelectDifficulty}
          onBack={() => setScreen("menu")}
        />
      )}
      {screen === "game" && (
        <div>Game placeholder — {difficulty}</div>
      )}
      {screen === "gameover" && (
        <div>Game Over placeholder</div>
      )}
    </div>
  );
}

export default App;
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Expected: Menu shows with Play button. Clicking Play shows difficulty selection. Clicking a difficulty shows "Game placeholder — easy/medium/hard". Back button returns to menu.

- [ ] **Step 5: Commit**

```bash
git add src/components/Menu.tsx src/components/DifficultySelect.tsx src/components/App.tsx
git commit -m "feat: add Menu, DifficultySelect screens and App routing"
```

---

### Task 10: GameContainer — Phaser-React Bridge

**Files:**
- Create: `src/components/GameContainer.tsx`
- Modify: `src/components/App.tsx`

- [ ] **Step 1: Create `src/components/GameContainer.tsx`**

```tsx
import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createPhaserConfig } from "../phaser/config";
import { Difficulty } from "../types";
import { GameStateManager } from "../game/state";

interface GameContainerProps {
  difficulty: Difficulty;
  stateManager: GameStateManager;
  onGameOver: () => void;
}

export function GameContainer({ difficulty, stateManager, onGameOver }: GameContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config = createPhaserConfig(containerRef.current, 800, 600);
    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Pass data to Phaser scenes via the registry
    game.registry.set("difficulty", difficulty);
    game.registry.set("stateManager", stateManager);

    // Listen for game over
    const handleStateChange = () => {
      const state = stateManager.getState();
      if (state.status === "won" || state.status === "lost") {
        onGameOver();
      }
    };
    stateManager.on("stateChange", handleStateChange);

    return () => {
      stateManager.off("stateChange", handleStateChange);
      game.destroy(true);
      gameRef.current = null;
    };
  }, [difficulty, stateManager, onGameOver]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "800px",
        height: "600px",
        margin: "0 auto",
      }}
    />
  );
}
```

- [ ] **Step 2: Update `src/components/App.tsx` to use GameContainer**

Replace the `{screen === "game"` block and add the import:

```tsx
import { useState, useRef, useCallback } from "react";
import { Difficulty } from "../types";
import { GameStateManager } from "../game/state";
import { Menu } from "./Menu";
import { DifficultySelect } from "./DifficultySelect";
import { GameContainer } from "./GameContainer";

type Screen = "menu" | "difficulty" | "game" | "gameover";

function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const stateManager = useRef(new GameStateManager()).current;

  const handleSelectDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    stateManager.startGame(d);
    setScreen("game");
  };

  const handleGameOver = useCallback(() => {
    setScreen("gameover");
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      {screen === "menu" && (
        <Menu onPlay={() => setScreen("difficulty")} />
      )}
      {screen === "difficulty" && (
        <DifficultySelect
          onSelect={handleSelectDifficulty}
          onBack={() => setScreen("menu")}
        />
      )}
      {screen === "game" && (
        <GameContainer
          difficulty={difficulty}
          stateManager={stateManager}
          onGameOver={handleGameOver}
        />
      )}
      {screen === "gameover" && (
        <div>Game Over placeholder</div>
      )}
    </div>
  );
}

export default App;
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Expected: Selecting a difficulty shows the Phaser canvas with "Game Loading..." text.

- [ ] **Step 4: Commit**

```bash
git add src/components/GameContainer.tsx src/components/App.tsx
git commit -m "feat: add GameContainer Phaser-React bridge"
```

---

### Task 11: GameScene — Board Rendering

**Files:**
- Modify: `src/phaser/scenes/GameScene.ts`

- [ ] **Step 1: Implement full GameScene with board rendering**

Replace `src/phaser/scenes/GameScene.ts`:

```ts
import Phaser from "phaser";
import { Board, Difficulty, Point } from "../../types";
import { GameStateManager } from "../../game/state";
import { createBoard, shuffleBoard, getRemainingTiles } from "../../game/board";
import { findPath, hasAnyValidMove } from "../../game/pathfinder";
import { calculateMatchScore } from "../../game/scoring";
import { DIFFICULTY_CONFIGS } from "../../game/constants";

const TILE_SIZE = 56;
const TILE_GAP = 4;
const BOARD_PADDING = 40;

export class GameScene extends Phaser.Scene {
  private board!: Board;
  private difficulty!: Difficulty;
  private stateManager!: GameStateManager;
  private tileObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private selectedTile: Point | null = null;
  private selectedHighlight: Phaser.GameObjects.Rectangle | null = null;
  private lineGraphics!: Phaser.GameObjects.Graphics;
  private isProcessing = false;
  private timerEvent: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    this.difficulty = this.registry.get("difficulty") as Difficulty;
    this.stateManager = this.registry.get("stateManager") as GameStateManager;

    this.board = createBoard(this.difficulty);
    this.lineGraphics = this.add.graphics();

    this.renderBoard();
    this.startTimer();

    // Listen for external actions (hint, shuffle, pause)
    this.stateManager.on("hint", () => this.handleHint());
    this.stateManager.on("shuffle", () => this.handleShuffle());
  }

  private renderBoard(): void {
    // Clear existing tile objects
    for (const [, obj] of this.tileObjects) {
      obj.destroy();
    }
    this.tileObjects.clear();

    const config = DIFFICULTY_CONFIGS[this.difficulty];
    const totalWidth = config.cols * (TILE_SIZE + TILE_GAP) - TILE_GAP;
    const totalHeight = config.rows * (TILE_SIZE + TILE_GAP) - TILE_GAP;
    const offsetX = (this.cameras.main.width - totalWidth) / 2;
    const offsetY = (this.cameras.main.height - totalHeight) / 2;

    for (let r = 0; r < this.board.length; r++) {
      for (let c = 0; c < this.board[r].length; c++) {
        const tile = this.board[r][c];
        if (tile === null) continue;

        const x = offsetX + c * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2;
        const y = offsetY + r * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2;

        const bg = this.add.rectangle(0, 0, TILE_SIZE, TILE_SIZE, 0x0f3460);
        bg.setStrokeStyle(2, 0x533483);

        const text = this.add.text(0, 0, tile.emoji, {
          fontSize: "28px",
        }).setOrigin(0.5);

        const container = this.add.container(x, y, [bg, text]);
        container.setSize(TILE_SIZE, TILE_SIZE);
        container.setInteractive();
        container.setData("row", r);
        container.setData("col", c);

        container.on("pointerdown", () => {
          if (!this.isProcessing) {
            this.onTileClick({ row: r, col: c });
          }
        });

        container.on("pointerover", () => {
          bg.setFillStyle(0x1a1a5e);
        });

        container.on("pointerout", () => {
          bg.setFillStyle(0x0f3460);
        });

        this.tileObjects.set(`${r},${c}`, container);
      }
    }
  }

  private getTileScreenPos(point: Point): { x: number; y: number } {
    const config = DIFFICULTY_CONFIGS[this.difficulty];
    const totalWidth = config.cols * (TILE_SIZE + TILE_GAP) - TILE_GAP;
    const totalHeight = config.rows * (TILE_SIZE + TILE_GAP) - TILE_GAP;
    const offsetX = (this.cameras.main.width - totalWidth) / 2;
    const offsetY = (this.cameras.main.height - totalHeight) / 2;
    return {
      x: offsetX + point.col * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2,
      y: offsetY + point.row * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2,
    };
  }

  private onTileClick(pos: Point): void {
    const tile = this.board[pos.row][pos.col];
    if (!tile) return;

    if (!this.selectedTile) {
      // First selection
      this.selectedTile = pos;
      this.highlightTile(pos);
      return;
    }

    // Clicking the same tile — deselect
    if (this.selectedTile.row === pos.row && this.selectedTile.col === pos.col) {
      this.clearSelection();
      return;
    }

    // Second selection — attempt match
    const path = findPath(this.board, this.selectedTile, pos);
    if (path) {
      this.isProcessing = true;
      this.handleMatch(this.selectedTile, pos, path);
    } else {
      this.handleMismatch(pos);
    }
  }

  private highlightTile(pos: Point): void {
    this.clearHighlight();
    const screenPos = this.getTileScreenPos(pos);
    this.selectedHighlight = this.add.rectangle(
      screenPos.x,
      screenPos.y,
      TILE_SIZE + 4,
      TILE_SIZE + 4
    );
    this.selectedHighlight.setStrokeStyle(3, 0xe94560);
    this.selectedHighlight.setFillStyle(0xe94560, 0.15);
  }

  private clearHighlight(): void {
    if (this.selectedHighlight) {
      this.selectedHighlight.destroy();
      this.selectedHighlight = null;
    }
  }

  private clearSelection(): void {
    this.selectedTile = null;
    this.clearHighlight();
  }

  private handleMatch(a: Point, b: Point, path: Point[]): void {
    // Draw connecting line
    this.drawPath(path);

    // Calculate score
    const state = this.stateManager.getState();
    const msSinceLastMatch = Date.now() - state.lastMatchTime;
    const score = calculateMatchScore(msSinceLastMatch, state.combo);

    this.stateManager.addScore(score);
    this.stateManager.incrementCombo();
    this.stateManager.setLastMatchTime(Date.now());

    // Animate tiles out after short delay for line to show
    this.time.delayedCall(300, () => {
      this.removeTile(a);
      this.removeTile(b);
      this.lineGraphics.clear();
      this.clearSelection();
      this.isProcessing = false;

      // Check win
      const remaining = getRemainingTiles(this.board);
      if (remaining.length === 0) {
        this.stateManager.setStatus("won");
        return;
      }

      // Check for available moves
      if (!hasAnyValidMove(this.board)) {
        this.autoShuffle();
      }
    });
  }

  private handleMismatch(clickedPos: Point): void {
    this.stateManager.resetCombo();

    // Shake the clicked tile
    const key = `${clickedPos.row},${clickedPos.col}`;
    const container = this.tileObjects.get(key);
    if (container) {
      this.tweens.add({
        targets: container,
        x: container.x - 5,
        duration: 50,
        yoyo: true,
        repeat: 3,
      });
    }

    // Select the new tile instead
    this.clearSelection();
    this.selectedTile = clickedPos;
    this.highlightTile(clickedPos);
  }

  private removeTile(pos: Point): void {
    this.board[pos.row][pos.col] = null;
    const key = `${pos.row},${pos.col}`;
    const container = this.tileObjects.get(key);
    if (container) {
      this.tweens.add({
        targets: container,
        scale: 0,
        alpha: 0,
        duration: 200,
        onComplete: () => container.destroy(),
      });
      this.tileObjects.delete(key);
    }
  }

  private drawPath(path: Point[]): void {
    this.lineGraphics.clear();
    this.lineGraphics.lineStyle(4, 0xe94560, 0.8);
    this.lineGraphics.beginPath();

    for (let i = 0; i < path.length; i++) {
      const screenPos = this.getTileScreenPos(path[i]);
      if (i === 0) {
        this.lineGraphics.moveTo(screenPos.x, screenPos.y);
      } else {
        this.lineGraphics.lineTo(screenPos.x, screenPos.y);
      }
    }

    this.lineGraphics.strokePath();
  }

  private startTimer(): void {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        const state = this.stateManager.getState();
        if (state.status === "playing") {
          this.stateManager.tick();
        }
      },
      loop: true,
    });
  }

  handleHint(): void {
    if (!this.stateManager.useHint()) return;

    // Find a valid pair
    const remaining = getRemainingTiles(this.board);
    for (let i = 0; i < remaining.length; i++) {
      for (let j = i + 1; j < remaining.length; j++) {
        if (remaining[i].tile.emoji === remaining[j].tile.emoji) {
          const path = findPath(this.board, remaining[i].pos, remaining[j].pos);
          if (path) {
            this.pulseHint(remaining[i].pos);
            this.pulseHint(remaining[j].pos);
            return;
          }
        }
      }
    }
  }

  private pulseHint(pos: Point): void {
    const key = `${pos.row},${pos.col}`;
    const container = this.tileObjects.get(key);
    if (container) {
      this.tweens.add({
        targets: container,
        scale: 1.2,
        duration: 300,
        yoyo: true,
        repeat: 2,
        ease: "Sine.easeInOut",
      });
    }
  }

  handleShuffle(): void {
    if (!this.stateManager.useShuffle()) return;
    this.performShuffle();
  }

  private autoShuffle(): void {
    this.performShuffle();
    // Emit event so React can show toast
    this.stateManager.emit("autoShuffle");
  }

  private performShuffle(): void {
    this.clearSelection();
    this.board = shuffleBoard(this.board);
    this.renderBoard();

    // If still no moves after shuffle, shuffle again
    if (getRemainingTiles(this.board).length > 0 && !hasAnyValidMove(this.board)) {
      this.performShuffle();
    }
  }

  destroy(): void {
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }
  }
}
```

Note: The `autoShuffle` method calls `this.stateManager.emit("autoShuffle")` — this requires making `emit` public in `GameStateManager`. Update `src/game/state.ts`:

Change `private emit` to `emit`:

```ts
emit(event: string): void {
  const listeners = this.listeners.get(event);
  if (listeners) {
    for (const l of listeners) l();
  }
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Expected: Selecting a difficulty shows Phaser canvas with emoji tiles arranged in a grid. Clicking tiles highlights them. Matching pairs removes them with animation and line drawing. Timer counts down via state manager.

- [ ] **Step 3: Commit**

```bash
git add src/phaser/scenes/GameScene.ts src/game/state.ts
git commit -m "feat: implement GameScene with tile rendering, matching, and animations"
```

---

### Task 12: HUD Component

**Files:**
- Create: `src/components/HUD.tsx`, `src/components/Toast.tsx`
- Modify: `src/components/App.tsx`

- [ ] **Step 1: Create `src/components/HUD.tsx`**

```tsx
import { useEffect, useState } from "react";
import { GameStateManager } from "../game/state";

interface HUDProps {
  stateManager: GameStateManager;
  onPause: () => void;
}

export function HUD({ stateManager, onPause }: HUDProps) {
  const [state, setState] = useState(stateManager.getState());

  useEffect(() => {
    const update = () => setState(stateManager.getState());
    stateManager.on("stateChange", update);
    return () => stateManager.off("stateChange", update);
  }, [stateManager]);

  const minutes = Math.floor(state.timerSeconds / 60);
  const seconds = state.timerSeconds % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "24px",
      padding: "12px 24px",
      background: "#16213e",
      borderRadius: "8px",
      marginBottom: "8px",
      fontSize: "16px",
    }}>
      <div>⏱ {timeStr}</div>
      <div>⭐ {state.score}</div>
      <button
        onClick={() => stateManager.emit("hint")}
        disabled={state.hintsRemaining <= 0}
        style={{
          padding: "6px 16px",
          background: state.hintsRemaining > 0 ? "#533483" : "#333",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: state.hintsRemaining > 0 ? "pointer" : "not-allowed",
        }}
      >
        💡 Hint ({state.hintsRemaining})
      </button>
      <button
        onClick={() => stateManager.emit("shuffle")}
        disabled={state.shufflesRemaining <= 0}
        style={{
          padding: "6px 16px",
          background: state.shufflesRemaining > 0 ? "#533483" : "#333",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: state.shufflesRemaining > 0 ? "pointer" : "not-allowed",
        }}
      >
        🔀 Shuffle ({state.shufflesRemaining})
      </button>
      <button
        onClick={onPause}
        style={{
          padding: "6px 16px",
          background: "#0f3460",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        ⏸ Pause
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/Toast.tsx`**

```tsx
import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, visible, onHide }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onHide();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!show) return null;

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#e94560",
      color: "#fff",
      padding: "12px 24px",
      borderRadius: "8px",
      fontSize: "16px",
      zIndex: 1000,
    }}>
      {message}
    </div>
  );
}
```

- [ ] **Step 3: Update `src/components/App.tsx` to include HUD and Toast**

```tsx
import { useState, useRef, useCallback } from "react";
import { Difficulty } from "../types";
import { GameStateManager } from "../game/state";
import { Menu } from "./Menu";
import { DifficultySelect } from "./DifficultySelect";
import { GameContainer } from "./GameContainer";
import { HUD } from "./HUD";
import { Toast } from "./Toast";

type Screen = "menu" | "difficulty" | "game" | "gameover";

function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [toastVisible, setToastVisible] = useState(false);
  const stateManager = useRef(new GameStateManager()).current;

  const handleSelectDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    stateManager.startGame(d);
    setScreen("game");
  };

  const handleGameOver = useCallback(() => {
    setScreen("gameover");
  }, []);

  const handlePause = () => {
    const state = stateManager.getState();
    if (state.status === "playing") {
      stateManager.setStatus("paused");
    } else if (state.status === "paused") {
      stateManager.setStatus("playing");
    }
  };

  // Listen for auto-shuffle toast
  useState(() => {
    stateManager.on("autoShuffle", () => {
      setToastVisible(true);
    });
  });

  return (
    <div style={{ textAlign: "center" }}>
      {screen === "menu" && (
        <Menu onPlay={() => setScreen("difficulty")} />
      )}
      {screen === "difficulty" && (
        <DifficultySelect
          onSelect={handleSelectDifficulty}
          onBack={() => setScreen("menu")}
        />
      )}
      {screen === "game" && (
        <div>
          <HUD stateManager={stateManager} onPause={handlePause} />
          <GameContainer
            difficulty={difficulty}
            stateManager={stateManager}
            onGameOver={handleGameOver}
          />
        </div>
      )}
      {screen === "gameover" && (
        <div>Game Over placeholder</div>
      )}
      <Toast
        message="No moves available — board shuffled!"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </div>
  );
}

export default App;
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Expected: HUD shows above the game board with timer counting down, score, hint/shuffle buttons, and pause. Clicking hint/shuffle triggers Phaser actions. Auto-shuffle shows toast.

- [ ] **Step 5: Commit**

```bash
git add src/components/HUD.tsx src/components/Toast.tsx src/components/App.tsx
git commit -m "feat: add HUD with timer, score, hint, shuffle, pause, and toast"
```

---

### Task 13: GameOver Screen

**Files:**
- Create: `src/components/GameOver.tsx`
- Modify: `src/components/App.tsx`

- [ ] **Step 1: Create `src/components/GameOver.tsx`**

```tsx
import { Difficulty } from "../types";
import { GameStateManager } from "../game/state";
import { DIFFICULTY_CONFIGS } from "../game/constants";

interface GameOverProps {
  stateManager: GameStateManager;
  difficulty: Difficulty;
  onPlayAgain: () => void;
  onMenu: () => void;
}

export function GameOver({ stateManager, difficulty, onPlayAgain, onMenu }: GameOverProps) {
  const state = stateManager.getState();
  const config = DIFFICULTY_CONFIGS[difficulty];
  const timeUsed = config.timerSeconds - state.timerSeconds;
  const minutes = Math.floor(timeUsed / 60);
  const seconds = timeUsed % 60;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "20px",
    }}>
      <h1 style={{ fontSize: "48px" }}>
        {state.status === "won" ? "🎉 You Win!" : "⏰ Time's Up!"}
      </h1>
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        fontSize: "20px",
      }}>
        <div>Score: {state.score}</div>
        <div>Time: {minutes}:{seconds.toString().padStart(2, "0")}</div>
        <div>Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</div>
      </div>
      <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
        <button
          onClick={onPlayAgain}
          style={{
            padding: "12px 32px",
            fontSize: "18px",
            background: "#e94560",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Play Again
        </button>
        <button
          onClick={onMenu}
          style={{
            padding: "12px 32px",
            fontSize: "18px",
            background: "#0f3460",
            color: "#fff",
            border: "1px solid #e94560",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Menu
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `src/components/App.tsx` to wire GameOver**

```tsx
import { useState, useRef, useCallback, useEffect } from "react";
import { Difficulty } from "../types";
import { GameStateManager } from "../game/state";
import { Menu } from "./Menu";
import { DifficultySelect } from "./DifficultySelect";
import { GameContainer } from "./GameContainer";
import { HUD } from "./HUD";
import { Toast } from "./Toast";
import { GameOver } from "./GameOver";

type Screen = "menu" | "difficulty" | "game" | "gameover";

function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [toastVisible, setToastVisible] = useState(false);
  const stateManager = useRef(new GameStateManager()).current;

  const handleSelectDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    stateManager.startGame(d);
    setScreen("game");
  };

  const handleGameOver = useCallback(() => {
    setScreen("gameover");
  }, []);

  const handlePlayAgain = () => {
    stateManager.startGame(difficulty);
    setScreen("game");
  };

  const handlePause = () => {
    const state = stateManager.getState();
    if (state.status === "playing") {
      stateManager.setStatus("paused");
    } else if (state.status === "paused") {
      stateManager.setStatus("playing");
    }
  };

  useEffect(() => {
    const handleAutoShuffle = () => setToastVisible(true);
    stateManager.on("autoShuffle", handleAutoShuffle);
    return () => stateManager.off("autoShuffle", handleAutoShuffle);
  }, [stateManager]);

  return (
    <div style={{ textAlign: "center" }}>
      {screen === "menu" && (
        <Menu onPlay={() => setScreen("difficulty")} />
      )}
      {screen === "difficulty" && (
        <DifficultySelect
          onSelect={handleSelectDifficulty}
          onBack={() => setScreen("menu")}
        />
      )}
      {screen === "game" && (
        <div>
          <HUD stateManager={stateManager} onPause={handlePause} />
          <GameContainer
            difficulty={difficulty}
            stateManager={stateManager}
            onGameOver={handleGameOver}
          />
        </div>
      )}
      {screen === "gameover" && (
        <GameOver
          stateManager={stateManager}
          difficulty={difficulty}
          onPlayAgain={handlePlayAgain}
          onMenu={() => setScreen("menu")}
        />
      )}
      <Toast
        message="No moves available — board shuffled!"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </div>
  );
}

export default App;
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Expected: When game ends (win or lose), GameOver screen shows with score, time, and Play Again / Menu buttons. Play Again starts a new game at same difficulty. Menu returns to main menu.

- [ ] **Step 4: Commit**

```bash
git add src/components/GameOver.tsx src/components/App.tsx
git commit -m "feat: add GameOver screen with play again and menu options"
```

---

### Task 14: Final Integration and Polish

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Ensure `src/main.tsx` is clean**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./components/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass (emoji, board, pathfinder, scoring, state).

- [ ] **Step 3: Full browser walkthrough**

```bash
npm run dev
```

Test the complete flow:
1. Menu → Play → Difficulty Select → Easy
2. Match two tiles — verify line draws, tiles disappear, score updates
3. Mismatch — verify shake animation
4. Click Hint — verify two tiles pulse
5. Click Shuffle — verify board rearranges
6. Let timer expire — verify "Time's Up" game over
7. Play Again → clear all tiles — verify "You Win" game over
8. Menu → return to main menu

- [ ] **Step 4: Verify production build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: final integration and polish for Pikachu Onet Connect"
```
