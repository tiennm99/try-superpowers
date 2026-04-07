import { BASE_MATCH_SCORE, SPEED_BONUS_MAX, SPEED_BONUS_WINDOW_MS } from "./constants";

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
