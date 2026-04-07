# Pikachu Onet Connect — Design Spec

## Overview

A browser-based Pikachu Onet Connect tile-matching game built with React 18 + Vite + Phaser 3 + TypeScript. Players match pairs of identical emoji tiles by connecting them with a path of at most 3 straight line segments (2 bends). The game features multiple difficulty levels, a countdown timer, scoring, hints, and shuffle.

## Tech Stack

- **React 18** — shell UI (menus, HUD, game over screen)
- **Vite** — build tool and dev server
- **Phaser 3** — game board rendering, animations, tile interaction
- **TypeScript** — entire codebase

## Architecture

### Layers

- **React layer**: Main menu, difficulty selector, HUD (timer, score, hints, shuffles, pause), game over screen
- **Phaser layer**: Game board rendering inside a React component via a `<div>` ref. Handles tile rendering, selection, matching animations, and line-drawing.
- **Bridge**: A shared game state manager (plain TypeScript class with EventEmitter pattern) that both React and Phaser read/write to.

### Directory Structure

```
src/
  components/       # React UI (Menu, HUD, GameOver, DifficultySelect)
  phaser/
    scenes/         # Phaser scenes (GameScene, PreloadScene)
    objects/        # Tile game object, line graphics
  game/
    board.ts        # Board generation, tile placement logic
    pathfinder.ts   # Connection validation (<=3 line segments)
    state.ts        # Shared game state manager
  types/            # TypeScript types
```

## Game Mechanics

### Board & Tiles

- Grid of emoji tiles; each cell holds one emoji from a set of 20+ visually distinct emoji (animals, fruits, objects).
- Tiles are placed in pairs — every emoji appears an even number of times.
- Board sizes by difficulty:
  - Easy: 6x4 (24 tiles, 12 pairs)
  - Medium: 8x6 (48 tiles, 24 pairs)
  - Hard: 10x8 (80 tiles, 40 pairs)
- Board is surrounded by an invisible empty border (1 cell thick) to allow connections that route around the edges.

### Matching Rules

- Player clicks two identical tiles.
- A valid connection must link them with a path of **at most 3 straight line segments** (at most 2 bends).
- The path can only travel through empty cells (cleared tiles or the border).
- If valid: tiles are removed, connecting line is briefly drawn, score increases.
- If invalid: brief shake animation, no penalty.

### Pathfinding Algorithm

- Input: grid state, tile A coordinates, tile B coordinates.
- Approach: for each empty cell reachable in a straight line from A, check if B is reachable from that cell in 1 more turn or less (direct or one bend).
- Optimization: early exit on direct line match, skip impossible directions.
- Returns: array of point coordinates forming the path, or `null`.

### Win/Lose Conditions

- **Win**: All tiles cleared before timer runs out.
- **Lose**: Timer expires with tiles remaining.
- **No valid moves**: Auto-shuffle remaining tiles with a toast notification (unlimited auto-shuffles).

## Features

### Timer

- Countdown per difficulty:
  - Easy: 5 minutes
  - Medium: 4 minutes
  - Hard: 3 minutes

### Scoring

- Base points per match: 100
- Speed bonus: bonus points based on time remaining between matches
- Combo multiplier: consecutive matches without mistakes increase the multiplier

### Hint System

- Button in HUD; highlights one valid pair by briefly pulsing the two tiles.
- Limited uses by difficulty:
  - Easy: 5 hints
  - Medium: 3 hints
  - Hard: 1 hint
- Remaining hint count displayed in HUD.

### Shuffle

- Button to randomize positions of all remaining tiles.
- Limited uses by difficulty:
  - Easy: 3 shuffles
  - Medium: 2 shuffles
  - Hard: 1 shuffle
- Auto-triggered (unlimited) when no valid moves exist, with a toast notification.

## UI Flow

```
Main Menu -> Difficulty Select -> Game (with HUD) -> Game Over (win/lose)
                                                   -> Play Again / Back to Menu
```

### HUD Layout (top bar)

`[Timer] [Score] [Hints remaining: button] [Shuffles remaining: button] [Pause]`

### Game Over Screen

- Shows win/lose status, final score, time taken.
- "Play Again" (same difficulty) and "Menu" buttons.

## Animations (Phaser)

- **Tile select**: scale bounce + glow
- **Match found**: draw connecting line (fades out), tiles pop/fade out
- **Invalid match**: brief shake
- **Hint**: pulsing highlight on two tiles

## Phaser-React Integration

- A `GameContainer` React component creates a `<div ref>` and initializes Phaser in `useEffect` with cleanup on unmount.
- Phaser game instance created with `Phaser.AUTO` renderer (WebGL with Canvas fallback).
- Communication:
  - Phaser scenes emit events (`match-found`, `game-over`, etc.) -> React listens via shared state manager -> updates HUD.
  - React dispatches actions (`hint`, `shuffle`, `pause`) -> Phaser scene listens and responds.

## Shared State Manager (`state.ts`)

- Plain TypeScript class using an EventEmitter pattern.
- Holds: score, timer, hints remaining, shuffles remaining, game status.
- Both React and Phaser subscribe to changes.
- Single source of truth to avoid sync bugs.

## Board Generation (`board.ts`)

- Pick N/2 unique emoji from the pool, duplicate each to form N tiles.
- Fisher-Yates shuffle.
- Place into 2D grid.
- Validate that at least one valid move exists; if not, reshuffle.

## Emoji Set

- Array of 20+ distinct, visually distinguishable emoji.
- Each difficulty uses a subset: Easy 12, Medium 24, Hard 40.
