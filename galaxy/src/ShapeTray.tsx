import React from 'react';
import { motion } from 'framer-motion';
import { Shape, Theme } from './types';

interface ShapeTrayProps {
  shapes: (Shape | null)[];
  theme: Theme;
  selectedIndex: number | null;
  onPointerDownShape: (index: number, e: React.PointerEvent) => void;
}

const ShapePiece: React.FC<{
  shape: Shape;
  theme: Theme;
  isSelected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}> = ({ shape, theme, isSelected, onPointerDown }) => {
  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const c of shape.cells) {
    minR = Math.min(minR, c.row); maxR = Math.max(maxR, c.row);
    minC = Math.min(minC, c.col); maxC = Math.max(maxC, c.col);
  }
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const cellSize = Math.min(24, 68 / Math.max(rows, cols));

  return (
    <motion.button
      className="relative flex items-center justify-center rounded-2xl"
      onPointerDown={onPointerDown}
      whileTap={{ scale: 0.9 }}
      animate={{ scale: isSelected ? 0.4 : 1, opacity: isSelected ? 0.3 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        width: 88,
        height: 88,
        touchAction: 'none',
        background: isSelected ? `${shape.color}12` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${theme.cellBorder}`,
      }}
    >
      <div style={{ position: 'relative', width: cols * (cellSize + 2), height: rows * (cellSize + 2) }}>
        {shape.cells.map((c, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: (c.col - minC) * (cellSize + 2),
              top: (c.row - minR) * (cellSize + 2),
              width: cellSize,
              height: cellSize,
              borderRadius: 5,
              background: shape.color,
              boxShadow: `inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -2px 3px rgba(0,0,0,0.15), 0 0 8px ${shape.color}30`,
            }}
          />
        ))}
      </div>
    </motion.button>
  );
};

export const ShapeTray: React.FC<ShapeTrayProps> = React.memo(({ shapes, theme, selectedIndex, onPointerDownShape }) => {
  return (
    <div className="flex items-center justify-center gap-2 py-1">
      {shapes.map((shape, index) => (
        <motion.div
          key={shape?.id || `empty-${index}`}
          initial={{ opacity: 0, y: 24, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: index * 0.07, type: 'spring', stiffness: 300, damping: 22 }}
        >
          {shape ? (
            <ShapePiece
              shape={shape}
              theme={theme}
              isSelected={selectedIndex === index}
              onPointerDown={e => onPointerDownShape(index, e)}
            />
          ) : (
            <div
              className="w-[88px] h-[88px] rounded-2xl opacity-15"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.cellBorder}` }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
});

ShapeTray.displayName = 'ShapeTray';
