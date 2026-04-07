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
