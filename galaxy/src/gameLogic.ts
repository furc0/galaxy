import { CellState, Position, Shape } from './types';

export const GRID_SIZE = 8;

export function createEmptyGrid(size: number = GRID_SIZE): CellState[][] {
  return Array.from({ length: size }, () => Array<CellState>(size).fill('empty'));
}

export function createEmptyColorGrid(size: number = GRID_SIZE): (string | null)[][] {
  return Array.from({ length: size }, () => Array<string | null>(size).fill(null));
}

export function applyBlockedCells(grid: CellState[][], blocked: Set<string>): CellState[][] {
  const g = grid.map(r => [...r]);
  for (let r = 0; r < g.length; r++) {
    for (let c = 0; c < g.length; c++) {
      if (blocked.has(`${r}-${c}`)) g[r][c] = 'blocked';
    }
  }
  return g;
}

export function canPlaceShape(
  grid: CellState[][],
  shape: Shape,
  position: Position
): boolean {
  for (const cell of shape.cells) {
    const row = position.row + cell.row;
    const col = position.col + cell.col;
    if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) return false;
    if (grid[row][col] !== 'empty') return false;
  }
  return true;
}

export function placeShape(
  grid: CellState[][],
  colorGrid: (string | null)[][],
  shape: Shape,
  position: Position
): { newGrid: CellState[][]; newColorGrid: (string | null)[][] } {
  const newGrid = grid.map(row => [...row]);
  const newColorGrid = colorGrid.map(row => [...row]);
  for (const cell of shape.cells) {
    const row = position.row + cell.row;
    const col = position.col + cell.col;
    newGrid[row][col] = 'filled';
    newColorGrid[row][col] = shape.color;
  }
  return { newGrid, newColorGrid };
}

// A line clears when every non-blocked cell in it is filled.
export function findCompletedLines(grid: CellState[][]): { rows: number[]; cols: number[] } {
  const size = grid.length;
  const completedRows: number[] = [];
  const completedCols: number[] = [];

  for (let r = 0; r < size; r++) {
    let complete = true;
    let anyUsable = false;
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 'blocked') continue;
      anyUsable = true;
      if (grid[r][c] !== 'filled') { complete = false; break; }
    }
    if (complete && anyUsable) completedRows.push(r);
  }

  for (let c = 0; c < size; c++) {
    let complete = true;
    let anyUsable = false;
    for (let r = 0; r < size; r++) {
      if (grid[r][c] === 'blocked') continue;
      anyUsable = true;
      if (grid[r][c] !== 'filled') { complete = false; break; }
    }
    if (complete && anyUsable) completedCols.push(c);
  }

  return { rows: completedRows, cols: completedCols };
}

export function clearLines(
  grid: CellState[][],
  colorGrid: (string | null)[][],
  rows: number[],
  cols: number[]
): { newGrid: CellState[][]; newColorGrid: (string | null)[][]; cellsCleared: Position[] } {
  const newGrid = grid.map(row => [...row]);
  const newColorGrid = colorGrid.map(row => [...row]);
  const seen = new Set<string>();
  const cellsCleared: Position[] = [];

  const add = (r: number, c: number) => {
    const k = `${r}-${c}`;
    if (seen.has(k)) return;
    seen.add(k);
    if (newGrid[r][c] === 'blocked') return;
    newGrid[r][c] = 'empty';
    newColorGrid[r][c] = null;
    cellsCleared.push({ row: r, col: c });
  };

  for (const r of rows) for (let c = 0; c < grid[0].length; c++) add(r, c);
  for (const c of cols) for (let r = 0; r < grid.length; r++) add(r, c);

  return { newGrid, newColorGrid, cellsCleared };
}

export function calculateScore(linesCleared: number, combo: number, cellsPlaced: number): number {
  const baseScore = linesCleared * 100;
  const comboMultiplier = 1 + Math.min(combo - 1, 8) * 0.5;
  const lineBonus = linesCleared > 1 ? linesCleared * 50 : 0;
  return Math.floor((baseScore + lineBonus) * comboMultiplier) + cellsPlaced;
}

export function canAnyShapeBePlaced(grid: CellState[][], shapes: (Shape | null)[]): boolean {
  const size = grid.length;
  for (const shape of shapes) {
    if (!shape) continue;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (canPlaceShape(grid, shape, { row: r, col: c })) return true;
      }
    }
  }
  return false;
}

export function getDifficultyForLevel(level: number): number {
  return Math.min(Math.floor(level / 3) + 1, 12);
}
