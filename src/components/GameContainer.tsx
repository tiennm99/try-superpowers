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
