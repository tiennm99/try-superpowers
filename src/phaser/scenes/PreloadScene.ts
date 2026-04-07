import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloadScene" });
  }

  preload(): void {
    // No assets to load — emoji are rendered as text
  }

  create(): void {
    this.scene.start("GameScene");
  }
}
