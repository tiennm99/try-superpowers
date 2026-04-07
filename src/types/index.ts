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
