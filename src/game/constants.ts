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
