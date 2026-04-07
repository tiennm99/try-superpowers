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
