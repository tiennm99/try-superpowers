import Phaser from "phaser";
import { Board, Difficulty, Point } from "../../types";
import { GameStateManager } from "../../game/state";
import { createBoard, shuffleBoard, getRemainingTiles } from "../../game/board";
import { findPath, hasAnyValidMove } from "../../game/pathfinder";
import { calculateMatchScore } from "../../game/scoring";
import { DIFFICULTY_CONFIGS } from "../../game/constants";

const TILE_SIZE = 56;
const TILE_GAP = 4;

export class GameScene extends Phaser.Scene {
  private board!: Board;
  private difficulty!: Difficulty;
  private stateManager!: GameStateManager;
  private tileObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private selectedTile: Point | null = null;
  private selectedHighlight: Phaser.GameObjects.Rectangle | null = null;
  private lineGraphics!: Phaser.GameObjects.Graphics;
  private isProcessing = false;
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private hintHandler!: () => void;
  private shuffleHandler!: () => void;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    this.difficulty = this.registry.get("difficulty") as Difficulty;
    this.stateManager = this.registry.get("stateManager") as GameStateManager;

    this.board = createBoard(this.difficulty);
    this.lineGraphics = this.add.graphics();

    this.renderBoard();
    this.startTimer();

    // Listen for external actions (hint, shuffle)
    this.hintHandler = () => this.handleHint();
    this.shuffleHandler = () => this.handleShuffle();
    this.stateManager.on("hint", this.hintHandler);
    this.stateManager.on("shuffle", this.shuffleHandler);
  }

  private renderBoard(): void {
    for (const [, obj] of this.tileObjects) {
      obj.destroy();
    }
    this.tileObjects.clear();

    const config = DIFFICULTY_CONFIGS[this.difficulty];
    const totalWidth = config.cols * (TILE_SIZE + TILE_GAP) - TILE_GAP;
    const totalHeight = config.rows * (TILE_SIZE + TILE_GAP) - TILE_GAP;
    const offsetX = (this.cameras.main.width - totalWidth) / 2;
    const offsetY = (this.cameras.main.height - totalHeight) / 2;

    for (let r = 0; r < this.board.length; r++) {
      for (let c = 0; c < this.board[r].length; c++) {
        const tile = this.board[r][c];
        if (tile === null) continue;

        const x = offsetX + c * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2;
        const y = offsetY + r * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2;

        const bg = this.add.rectangle(0, 0, TILE_SIZE, TILE_SIZE, 0x0f3460);
        bg.setStrokeStyle(2, 0x533483);

        const text = this.add
          .text(0, 0, tile.emoji, {
            fontSize: "28px",
          })
          .setOrigin(0.5);

        const container = this.add.container(x, y, [bg, text]);
        container.setSize(TILE_SIZE, TILE_SIZE);
        container.setInteractive();
        container.setData("row", r);
        container.setData("col", c);

        container.on("pointerdown", () => {
          if (!this.isProcessing) {
            this.onTileClick({ row: r, col: c });
          }
        });

        container.on("pointerover", () => {
          bg.setFillStyle(0x1a1a5e);
        });

        container.on("pointerout", () => {
          bg.setFillStyle(0x0f3460);
        });

        this.tileObjects.set(`${r},${c}`, container);
      }
    }
  }

  private getTileScreenPos(point: Point): { x: number; y: number } {
    const config = DIFFICULTY_CONFIGS[this.difficulty];
    const totalWidth = config.cols * (TILE_SIZE + TILE_GAP) - TILE_GAP;
    const totalHeight = config.rows * (TILE_SIZE + TILE_GAP) - TILE_GAP;
    const offsetX = (this.cameras.main.width - totalWidth) / 2;
    const offsetY = (this.cameras.main.height - totalHeight) / 2;
    return {
      x: offsetX + point.col * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2,
      y: offsetY + point.row * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2,
    };
  }

  private onTileClick(pos: Point): void {
    if (this.stateManager.getState().status !== "playing") return;
    const tile = this.board[pos.row][pos.col];
    if (!tile) return;

    if (!this.selectedTile) {
      this.selectedTile = pos;
      this.highlightTile(pos);
      return;
    }

    if (
      this.selectedTile.row === pos.row &&
      this.selectedTile.col === pos.col
    ) {
      this.clearSelection();
      return;
    }

    const path = findPath(this.board, this.selectedTile, pos);
    if (path) {
      this.isProcessing = true;
      this.handleMatch(this.selectedTile, pos, path);
    } else {
      this.handleMismatch(pos);
    }
  }

  private highlightTile(pos: Point): void {
    this.clearHighlight();
    const screenPos = this.getTileScreenPos(pos);
    this.selectedHighlight = this.add.rectangle(
      screenPos.x,
      screenPos.y,
      TILE_SIZE + 4,
      TILE_SIZE + 4,
    );
    this.selectedHighlight.setStrokeStyle(3, 0xe94560);
    this.selectedHighlight.setFillStyle(0xe94560, 0.15);
  }

  private clearHighlight(): void {
    if (this.selectedHighlight) {
      this.selectedHighlight.destroy();
      this.selectedHighlight = null;
    }
  }

  private clearSelection(): void {
    this.selectedTile = null;
    this.clearHighlight();
  }

  private handleMatch(a: Point, b: Point, path: Point[]): void {
    this.drawPath(path);

    const state = this.stateManager.getState();
    const msSinceLastMatch = Date.now() - state.lastMatchTime;
    const score = calculateMatchScore(msSinceLastMatch, state.combo);

    this.stateManager.addScore(score);
    this.stateManager.incrementCombo();
    this.stateManager.setLastMatchTime(Date.now());

    this.time.delayedCall(300, () => {
      this.removeTile(a);
      this.removeTile(b);
      this.lineGraphics.clear();
      this.clearSelection();
      this.isProcessing = false;

      const remaining = getRemainingTiles(this.board);
      if (remaining.length === 0) {
        this.stateManager.setStatus("won");
        return;
      }

      if (!hasAnyValidMove(this.board)) {
        this.autoShuffle();
      }
    });
  }

  private handleMismatch(clickedPos: Point): void {
    this.stateManager.resetCombo();

    const key = `${clickedPos.row},${clickedPos.col}`;
    const container = this.tileObjects.get(key);
    if (container) {
      this.tweens.add({
        targets: container,
        x: container.x - 5,
        duration: 50,
        yoyo: true,
        repeat: 3,
      });
    }

    this.clearSelection();
    this.selectedTile = clickedPos;
    this.highlightTile(clickedPos);
  }

  private removeTile(pos: Point): void {
    this.board[pos.row][pos.col] = null;
    const key = `${pos.row},${pos.col}`;
    const container = this.tileObjects.get(key);
    if (container) {
      this.tweens.add({
        targets: container,
        scale: 0,
        alpha: 0,
        duration: 200,
        onComplete: () => container.destroy(),
      });
      this.tileObjects.delete(key);
    }
  }

  private drawPath(path: Point[]): void {
    this.lineGraphics.clear();
    this.lineGraphics.lineStyle(4, 0xe94560, 0.8);
    this.lineGraphics.beginPath();

    for (let i = 0; i < path.length; i++) {
      const screenPos = this.getTileScreenPos(path[i]);
      if (i === 0) {
        this.lineGraphics.moveTo(screenPos.x, screenPos.y);
      } else {
        this.lineGraphics.lineTo(screenPos.x, screenPos.y);
      }
    }

    this.lineGraphics.strokePath();
  }

  private startTimer(): void {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        const state = this.stateManager.getState();
        if (state.status === "playing") {
          this.stateManager.tick();
        }
      },
      loop: true,
    });
  }

  handleHint(): void {
    if (!this.stateManager.useHint()) return;

    const remaining = getRemainingTiles(this.board);
    for (let i = 0; i < remaining.length; i++) {
      for (let j = i + 1; j < remaining.length; j++) {
        if (remaining[i].tile.emoji === remaining[j].tile.emoji) {
          const path = findPath(
            this.board,
            remaining[i].pos,
            remaining[j].pos,
          );
          if (path) {
            this.pulseHint(remaining[i].pos);
            this.pulseHint(remaining[j].pos);
            return;
          }
        }
      }
    }
  }

  private pulseHint(pos: Point): void {
    const key = `${pos.row},${pos.col}`;
    const container = this.tileObjects.get(key);
    if (container) {
      this.tweens.add({
        targets: container,
        scale: 1.2,
        duration: 300,
        yoyo: true,
        repeat: 2,
        ease: "Sine.easeInOut",
      });
    }
  }

  handleShuffle(): void {
    if (!this.stateManager.useShuffle()) return;
    this.performShuffle();
  }

  private autoShuffle(): void {
    this.performShuffle();
    this.stateManager.emit("autoShuffle");
  }

  private performShuffle(): void {
    this.clearSelection();
    do {
      this.board = shuffleBoard(this.board);
    } while (getRemainingTiles(this.board).length > 0 && !hasAnyValidMove(this.board));
    this.renderBoard();
  }

  destroy(): void {
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }
    if (this.stateManager) {
      this.stateManager.off("hint", this.hintHandler);
      this.stateManager.off("shuffle", this.shuffleHandler);
    }
  }
}
