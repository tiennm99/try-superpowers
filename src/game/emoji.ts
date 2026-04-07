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
