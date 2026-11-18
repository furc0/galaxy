import { Position, Shape } from './types';
import { mulberry32 } from './storage';

const shapeTemplates: Position[][] = [
  [{ row: 0, col: 0 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }],
  [{ row: 0, col: 0 }, { row: 1, col: 0 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }],
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
  [{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 1 }],
  [{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 0 }],
  [{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 1 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }],
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
  [{ row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 2 }, { row: 2, col: 2 }],
  [{ row: 0, col: 2 }, { row: 1, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }],
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }, { row: 4, col: 0 }],
  [{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 1 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 0 }, { row: 2, col: 1 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }],
];

let shapeIdCounter = 0;

function maxCellsForDifficulty(difficulty: number): number {
  if (difficulty <= 2) return 3;
  if (difficulty <= 5) return 4;
  if (difficulty <= 9) return 5;
  return 9;
}

export function generateShape(colors: string[], difficulty: number = 1, rng: () => number = Math.random): Shape {
  const maxCells = maxCellsForDifficulty(difficulty);
  const available = shapeTemplates.filter(t => t.length <= maxCells);

  // Weight towards medium shapes so the game never feels trivial or unfair
  const weights = available.map(t => {
    const ideal = Math.min(2 + difficulty * 0.4, 5);
    return 1 / (1 + Math.abs(t.length - ideal));
  });
  let total = 0;
  for (const w of weights) total += w;
  let pick = rng() * total;
  let idx = 0;
  while (idx < available.length - 1 && pick > weights[idx]) { pick -= weights[idx]; idx++; }

  const template = available[idx];
  const color = colors[Math.floor(rng() * colors.length)];
  shapeIdCounter++;
  return {
    id: `shape-${shapeIdCounter}-${Math.floor(rng() * 1e6)}`,
    cells: [...template],
    color,
  };
}

export function generateShapes(count: number, colors: string[], difficulty: number = 1, rng: () => number = Math.random): (Shape | null)[] {
  const shapes: (Shape | null)[] = [];
  for (let i = 0; i < count; i++) shapes.push(generateShape(colors, difficulty, rng));
  return shapes;
}

export function getShapeBounds(cells: Position[]): { minRow: number; maxRow: number; minCol: number; maxCol: number } {
  let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
  for (const cell of cells) {
    minRow = Math.min(minRow, cell.row);
    maxRow = Math.max(maxRow, cell.row);
    minCol = Math.min(minCol, cell.col);
    maxCol = Math.max(maxCol, cell.col);
  }
  return { minRow, maxRow, minCol, maxCol };
}
