import { Board, Difficulty, TileData, Point } from "../types";
import { DIFFICULTY_CONFIGS } from "./constants";
import { getEmojisForDifficulty } from "./emoji";

let nextTileId = 0;

export function createBoard(difficulty: Difficulty): Board {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const { rows, cols } = config;
  const emojis = getEmojisForDifficulty(difficulty);

  // Create pairs
  const tiles: TileData[] = [];
  nextTileId = 0;
  for (const emoji of emojis) {
    tiles.push({ emoji, id: nextTileId++ });
    tiles.push({ emoji, id: nextTileId++ });
  }

  // Fisher-Yates shuffle
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  // Place into grid
  const board: Board = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    const row: (TileData | null)[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(tiles[idx++]);
    }
    board.push(row);
  }

  return board;
}

export function getRemainingTiles(board: Board): { tile: TileData; pos: Point }[] {
  const result: { tile: TileData; pos: Point }[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const cell = board[r][c];
      if (cell !== null) {
        result.push({ tile: cell, pos: { row: r, col: c } });
      }
    }
  }
  return result;
}

export function shuffleBoard(board: Board): Board {
  const rows = board.length;
  const cols = board[0].length;

  const tiles: TileData[] = [];
  const occupiedPositions: Point[] = [];
  const emptyPositions: Point[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] !== null) {
        tiles.push(board[r][c]!);
        occupiedPositions.push({ row: r, col: c });
      } else {
        emptyPositions.push({ row: r, col: c });
      }
    }
  }

  // Fisher-Yates shuffle the tiles
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  // Create new board with nulls
  const newBoard: Board = [];
  for (let r = 0; r < rows; r++) {
    newBoard.push(new Array(cols).fill(null));
  }

  // Place shuffled tiles back into occupied positions
  for (let i = 0; i < tiles.length; i++) {
    const pos = occupiedPositions[i];
    newBoard[pos.row][pos.col] = tiles[i];
  }

  return newBoard;
}
