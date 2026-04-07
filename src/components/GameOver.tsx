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
