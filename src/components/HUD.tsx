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
