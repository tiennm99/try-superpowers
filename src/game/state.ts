import { Difficulty, GameStatus } from "../types";
import { DIFFICULTY_CONFIGS } from "./constants";

type Listener = () => void;

interface GameState {
  status: GameStatus;
  difficulty: Difficulty | null;
  score: number;
  timerSeconds: number;
  hintsRemaining: number;
  shufflesRemaining: number;
  combo: number;
  lastMatchTime: number;
}

export class GameStateManager {
  private state: GameState;
  private listeners: Map<string, Listener[]> = new Map();

  constructor() {
    this.state = {
      status: "menu",
      difficulty: null,
      score: 0,
      timerSeconds: 0,
      hintsRemaining: 0,
      shufflesRemaining: 0,
      combo: 1,
      lastMatchTime: 0,
    };
  }

  getState(): Readonly<GameState> {
    return { ...this.state };
  }

  on(event: string, listener: Listener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: Listener): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    }
  }

  emit(event: string): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const l of listeners) l();
    }
  }

  startGame(difficulty: Difficulty): void {
    const config = DIFFICULTY_CONFIGS[difficulty];
    this.state = {
      status: "playing",
      difficulty,
      score: 0,
      timerSeconds: config.timerSeconds,
      hintsRemaining: config.hints,
      shufflesRemaining: config.shuffles,
      combo: 1,
      lastMatchTime: Date.now(),
    };
    this.emit("stateChange");
  }

  addScore(points: number): void {
    this.state.score += points;
    this.emit("stateChange");
  }

  useHint(): boolean {
    if (this.state.hintsRemaining <= 0) return false;
    this.state.hintsRemaining--;
    this.emit("stateChange");
    return true;
  }

  useShuffle(): boolean {
    if (this.state.shufflesRemaining <= 0) return false;
    this.state.shufflesRemaining--;
    this.emit("stateChange");
    return true;
  }

  tick(): void {
    if (this.state.status !== "playing") return;
    this.state.timerSeconds--;
    if (this.state.timerSeconds <= 0) {
      this.state.timerSeconds = 0;
      this.state.status = "lost";
    }
    this.emit("stateChange");
  }

  incrementCombo(): void {
    this.state.combo++;
    this.emit("stateChange");
  }

  resetCombo(): void {
    this.state.combo = 1;
    this.emit("stateChange");
  }

  setStatus(status: GameStatus): void {
    this.state.status = status;
    this.emit("stateChange");
  }

  setLastMatchTime(time: number): void {
    this.state.lastMatchTime = time;
  }
}
