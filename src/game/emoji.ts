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
  const shuffled = [...EMOJI_POOL];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
