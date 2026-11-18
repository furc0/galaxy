export type CellState = 'empty' | 'filled' | 'blocked';

export interface Position {
  row: number;
  col: number;
}

export interface Shape {
  id: string;
  cells: Position[];
  color: string;
}

export interface Theme {
  id: string;
  name: string;
  bg: string;
  bgGradient: string;
  gridBg: string;
  cellEmpty: string;
  cellBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  colors: string[];
  particleColors: string[];
  glowColor: string;
}

export interface Level {
  id: number;
  name: string;
  gridSize: number;
  targetScore: number;
  linesToClear: number;
  shapesPerRound: number;
  description: string;
}

export type GameMode = 'free' | 'level' | 'daily';

export interface GameState {
  grid: CellState[][];
  gridColors: (string | null)[][];
  score: number;
  highScore: number;
  combo: number;
  maxCombo: number;
  shapes: (Shape | null)[];
  isGameOver: boolean;
  linesCleared: number;   // lines cleared in current game
  totalLinesCleared: number;
  level: number | null;
  mode: GameMode;
}

export type ScreenName = 'menu' | 'game' | 'levels' | 'settings';
