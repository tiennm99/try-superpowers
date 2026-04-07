import Phaser from "phaser";
import { PreloadScene } from "./scenes/PreloadScene";
import { GameScene } from "./scenes/GameScene";

export function createPhaserConfig(
  parent: HTMLElement,
  width: number,
  height: number
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width,
    height,
    backgroundColor: "#16213e",
    scene: [PreloadScene, GameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };
}
