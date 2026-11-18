import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CellState, Position, Shape, Theme } from './types';
import { canPlaceShape } from './gameLogic';

interface GridProps {
  grid: CellState[][];
  gridColors: (string | null)[][];
  theme: Theme;
  clearedCells: Position[];
  dragShape: Shape | null;
  dragPosition: Position | null;
}

export const Grid: React.FC<GridProps> = React.memo(({
  grid,
  gridColors,
  theme,
  clearedCells,
  dragShape,
  dragPosition,
}) => {
  const size = grid.length;

  const clearedSet = useMemo(() => {
    const set = new Set<string>();
    clearedCells.forEach(c => set.add(`${c.row}-${c.col}`));
    return set;
  }, [clearedCells]);

  const { previewSet, previewValid } = useMemo(() => {
    const set = new Set<string>();
    if (!dragShape || !dragPosition) return { previewSet: set, previewValid: false };
    const valid = canPlaceShape(grid, dragShape, dragPosition);
    dragShape.cells.forEach(cell => {
      const r = dragPosition.row + cell.row;
      const c = dragPosition.col + cell.col;
      if (r >= 0 && r < size && c >= 0 && c < size) set.add(`${r}-${c}`);
    });
    return { previewSet: set, previewValid: valid };
  }, [dragShape, dragPosition, grid, size]);

  return (
    <div
      className="relative rounded-2xl p-1.5"
      style={{
        background: theme.gridBg,
        boxShadow: `0 0 40px ${theme.glowColor}, inset 0 0 20px rgba(0,0,0,0.3)`,
        transition: 'background 800ms ease, box-shadow 800ms ease',
      }}
    >
      <div
        className="grid gap-[3px] rounded-xl"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          aspectRatio: '1',
        }}
      >
        {Array.from({ length: size * size }).map((_, idx) => {
          const row = Math.floor(idx / size);
          const col = idx % size;
          const cellState = grid[row][col];
          const cellColor = gridColors[row][col];
          const key = `${row}-${col}`;
          const isCleared = clearedSet.has(key);
          const isPreview = previewSet.has(key);
          const isBlocked = cellState === 'blocked';

          if (isBlocked) {
            return (
              <div
                key={key}
                className="rounded-md"
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  border: `1px dashed ${theme.cellBorder}`,
                }}
              />
            );
          }

          return (
            <motion.div
              key={key}
              className="relative rounded-md"
              initial={false}
              animate={
                isCleared
                  ? { scale: [1, 1.25, 0.9], opacity: [1, 1, 0.6], filter: ['brightness(1)', 'brightness(2.2)', 'brightness(1)'] }
                  : { scale: 1, opacity: 1 }
              }
              transition={isCleared ? { duration: 0.38, ease: 'easeOut' } : { duration: 0.15 }}
              style={{
                background: isPreview
                  ? (previewValid ? `${dragShape?.color}55` : 'rgba(255,80,80,0.25)')
                  : cellState === 'filled' && cellColor
                  ? cellColor
                  : theme.cellEmpty,
                border: `1px solid ${isPreview && !previewValid ? 'rgba(255,90,90,0.5)' : theme.cellBorder}`,
                boxShadow: cellState === 'filled' && cellColor
                  ? `inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -2px 3px rgba(0,0,0,0.2)`
                  : 'none',
                transition: 'background 120ms linear',
              }}
            >
              {cellState === 'filled' && cellColor && !isCleared && (
                <div
                  className="absolute inset-0 rounded-md"
                  style={{
                    background: `linear-gradient(150deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.18) 100%)`,
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

Grid.displayName = 'Grid';
