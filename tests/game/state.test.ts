import { describe, it, expect, vi, beforeEach } from "vitest";
import { GameStateManager } from "../../src/game/state";

describe("GameStateManager", () => {
  let state: GameStateManager;

  beforeEach(() => {
    state = new GameStateManager();
  });

  it("initializes with menu status", () => {
    expect(state.getState().status).toBe("menu");
  });

  it("startGame sets state for given difficulty", () => {
    state.startGame("easy");
    const s = state.getState();
    expect(s.status).toBe("playing");
    expect(s.score).toBe(0);
    expect(s.hintsRemaining).toBe(5);
    expect(s.shufflesRemaining).toBe(3);
    expect(s.timerSeconds).toBe(300);
    expect(s.difficulty).toBe("easy");
    expect(s.combo).toBe(1);
  });

  it("addScore increases score", () => {
    state.startGame("easy");
    state.addScore(150);
    expect(state.getState().score).toBe(150);
    state.addScore(100);
    expect(state.getState().score).toBe(250);
  });

  it("useHint decrements hints", () => {
    state.startGame("easy");
    expect(state.useHint()).toBe(true);
    expect(state.getState().hintsRemaining).toBe(4);
  });

  it("useHint returns false when no hints left", () => {
    state.startGame("hard");
    expect(state.useHint()).toBe(true);
    expect(state.useHint()).toBe(false);
    expect(state.getState().hintsRemaining).toBe(0);
  });

  it("useShuffle decrements shuffles", () => {
    state.startGame("easy");
    expect(state.useShuffle()).toBe(true);
    expect(state.getState().shufflesRemaining).toBe(2);
  });

  it("useShuffle returns false when no shuffles left", () => {
    state.startGame("hard");
    expect(state.useShuffle()).toBe(true);
    expect(state.useShuffle()).toBe(false);
  });

  it("tick decrements timer", () => {
    state.startGame("easy");
    state.tick();
    expect(state.getState().timerSeconds).toBe(299);
  });

  it("tick sets status to lost when timer reaches 0", () => {
    state.startGame("easy");
    for (let i = 0; i < 300; i++) {
      state.tick();
    }
    expect(state.getState().status).toBe("lost");
    expect(state.getState().timerSeconds).toBe(0);
  });

  it("emits events on state change", () => {
    const listener = vi.fn();
    state.on("stateChange", listener);
    state.startGame("easy");
    expect(listener).toHaveBeenCalled();
  });

  it("incrementCombo and resetCombo work", () => {
    state.startGame("easy");
    state.incrementCombo();
    expect(state.getState().combo).toBe(2);
    state.incrementCombo();
    expect(state.getState().combo).toBe(3);
    state.resetCombo();
    expect(state.getState().combo).toBe(1);
  });

  it("setStatus changes status and emits", () => {
    state.startGame("easy");
    const listener = vi.fn();
    state.on("stateChange", listener);
    state.setStatus("won");
    expect(state.getState().status).toBe("won");
    expect(listener).toHaveBeenCalled();
  });

  it("pause and resume toggle status", () => {
    state.startGame("easy");
    state.setStatus("paused");
    expect(state.getState().status).toBe("paused");
    state.setStatus("playing");
    expect(state.getState().status).toBe("playing");
  });
});
