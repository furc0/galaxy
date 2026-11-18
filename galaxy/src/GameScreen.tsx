import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, Position, Theme } from './types';
import { Grid } from './Grid';
import { ShapeTray } from './ShapeTray';
import { ParticleEffect } from './ParticleEffect';
import { GameOverScreen } from './GameOverScreen';
import { GameResult } from './useGame';
import { getLevelById } from './levels';
import { loadDaily, todayKey } from './storage';
import { playSelectSound } from './sounds';

interface GameScreenProps {
  gameState: GameState;
  theme: Theme;
  clearedCells: Position[];
  showCombo: boolean;
  lastScore: number;
  result: GameResult | null;
  onPlaceShape: (shapeIndex: number, position: Position) => boolean;
  onRestart: () => void;
  onNextLevel: (() => void) | null;
  onMenu: () => void;
  onGameFinished?: () => void;
}

const LIFT = 70; // px the shape floats above the finger on touch devices

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  theme,
  clearedCells,
  showCombo,
  lastScore,
  result,
  onPlaceShape,
  onRestart,
  onNextLevel,
  onMenu,
  onGameFinished,
}) => {
  const [selectedShape, setSelectedShape] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedRef = useRef<number | null>(null);
  selectedRef.current = selectedShape;

  const gridSize = gameState.grid.length;

  const level = gameState.mode === 'level' && gameState.level ? getLevelById(gameState.level) : null;
  const daily = loadDaily();
  const dailyFresh = !daily || daily.date !== todayKey();

  // Notify parent when a game finishes so stats HUD refreshes
  const finishedRef = useRef(false);
  useEffect(() => {
    if (gameState.isGameOver && result && !finishedRef.current) {
      finishedRef.current = true;
      onGameFinished?.();
    }
    if (!gameState.isGameOver) finishedRef.current = false;
  }, [gameState.isGameOver, result, onGameFinished]);

  const cellMetrics = useCallback(() => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    return { rect, cw: rect.width / gridSize, ch: rect.height / gridSize };
  }, [gridSize]);

  // Anchor = top-left cell of the shape for a given screen point
  const anchorFor = useCallback((clientX: number, clientY: number): Position | null => {
    const m = cellMetrics();
    if (!m) return null;
    const idx = selectedRef.current;
    const shape = idx != null ? gameState.shapes[idx] : null;
    if (!shape) return null;
    let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
    for (const c of shape.cells) {
      minR = Math.min(minR, c.row); maxR = Math.max(maxR, c.row);
      minC = Math.min(minC, c.col); maxC = Math.max(maxC, c.col);
    }
    const h = maxR - minR + 1, w = maxC - minC + 1;
    const gx = clientX - m.rect.left;
    const gy = clientY - m.rect.top;
    const centerRow = Math.floor(gy / m.ch - (h - 1) / 2 + 0.5);
    const centerCol = Math.floor(gx / m.cw - (w - 1) / 2 + 0.5);
    return { row: centerRow - minR, col: centerCol - minC };
  }, [cellMetrics, gameState.shapes]);

  const trySelect = useCallback((idx: number) => {
    if (!gameState.shapes[idx]) return;
    setSelectedShape(prev => (prev === idx ? null : idx));
    playSelectSound();
  }, [gameState.shapes]);

  // Global pointer handlers while dragging (robust outside grid bounds)
  useEffect(() => {
    if (!isDragging) return;
    const move = (e: PointerEvent) => {
      e.preventDefault();
      setDragPos({ x: e.clientX, y: e.clientY });
    };
    const up = (e: PointerEvent) => {
      const idx = selectedRef.current;
      if (idx != null) {
        const pos = anchorFor(e.clientX, e.clientY - LIFT);
        if (pos) {
          const placed = onPlaceShape(idx, pos);
          if (placed) setSelectedShape(null);
        }
      }
      setIsDragging(false);
      setDragPos(null);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [isDragging, anchorFor, onPlaceShape]);

  const handleTrayPointerDown = useCallback((idx: number, e: React.PointerEvent) => {
    e.preventDefault();
    trySelect(idx);
    if (gameState.shapes[idx]) {
      setIsDragging(true);
      setDragPos({ x: e.clientX, y: e.clientY });
    }
  }, [gameState.shapes, trySelect]);

  const handleGhostMove = useCallback((e: React.MouseEvent) => {
    if (selectedShape == null || isDragging) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  }, [selectedShape, isDragging]);

  const dragShape = selectedShape != null ? gameState.shapes[selectedShape] : null;
  const ghostPos = dragShape && dragPos ? anchorFor(dragPos.x, dragPos.y - (isDragging ? LIFT : 0)) : null;

  // progress toward goal
  let progressLabel = '';
  let progress = 0;
  if (level) {
    progressLabel = `${Math.min(gameState.linesCleared, level.linesToClear)} / ${level.linesToClear} линий`;
    progress = Math.min(1, gameState.linesCleared / level.linesToClear);
  } else if (gameState.mode === 'daily') {
    progressLabel = `${Math.min(gameState.linesCleared, 5)} / 5 линий`;
    progress = Math.min(1, gameState.linesCleared / 5);
  }

  return (
    <motion.div
      className="flex flex-col h-full px-3 pt-3 pb-2 relative select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ touchAction: 'none' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-2">
        <motion.button
          onClick={onMenu}
          whileTap={{ scale: 0.9 }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-base"
          style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.cellBorder}`, color: theme.textSecondary }}
        >
          ✕
        </motion.button>

        <div className="text-center">
          <motion.p
            className="text-3xl font-light tabular-nums leading-none"
            key={gameState.score}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{ color: theme.textPrimary }}
          >
            {gameState.score.toLocaleString()}
          </motion.p>
          <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: theme.textSecondary }}>
            {gameState.mode === 'level' ? `Уровень ${gameState.level}` : gameState.mode === 'daily' ? 'Ежедневно' : 'Рекорд ' + gameState.highScore.toLocaleString()}
          </p>
        </div>

        <motion.button
          onClick={onRestart}
          whileTap={{ scale: 0.9, rotate: 90 }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-base"
          style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.cellBorder}`, color: theme.textSecondary }}
        >
          ↻
        </motion.button>
      </div>

      {/* Level / daily progress */}
      {(level || gameState.mode === 'daily') && (
        <div className="mb-2 px-1">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.colors[1]})` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: theme.textSecondary }}>{progressLabel}</span>
            {level && <span className="text-[10px]" style={{ color: theme.textSecondary }}>{level.name}</span>}
          </div>
        </div>
      )}
      {gameState.mode === 'daily' && dailyFresh && (
        <p className="text-center text-[10px] mb-1" style={{ color: theme.accent }}>
          Один шанс в день · все играют одно поле
        </p>
      )}

      {/* Combo pill */}
      <AnimatePresence>
        {showCombo && gameState.combo > 1 && (
          <motion.div
            className="absolute top-24 left-1/2 -translate-x-1/2 z-40"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
          >
            <div
              className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap"
              style={{
                background: `${theme.accent}25`,
                border: `1px solid ${theme.accent}50`,
                color: theme.textPrimary,
                boxShadow: `0 0 24px ${theme.accent}40`,
              }}
            >
              Комбо ×{gameState.combo} · +{lastScore}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div
        className="flex-1 flex items-center justify-center relative min-h-0"
        onMouseMove={handleGhostMove}
      >
        <div ref={gridRef} className="w-full max-w-[min(92vw,420px)] relative">
          <Grid
            grid={gameState.grid}
            gridColors={gameState.gridColors}
            theme={theme}
            clearedCells={clearedCells}
            dragShape={ghostPos ? dragShape : null}
            dragPosition={ghostPos}
          />
          <ParticleEffect
            cells={clearedCells}
            colors={theme.particleColors}
            gridSize={gridSize}
            canvasRef={canvasRef}
          />
        </div>
      </div>

      {/* Hint */}
      <p className="text-center text-[11px] h-4 my-1" style={{ color: theme.textSecondary }}>
        {dragShape ? 'Отпусти над полем, чтобы поставить' : 'Возьми фигуру и перетащи на поле'}
      </p>

      {/* Tray */}
      <ShapeTray
        shapes={gameState.shapes}
        theme={theme}
        selectedIndex={selectedShape}
        onPointerDownShape={handleTrayPointerDown}
      />

      {/* Floating dragged shape */}
      {dragShape && dragPos && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: dragPos.x,
            top: dragPos.y - LIFT,
            transform: 'translate(-50%, -50%) scale(1.15)',
          }}
        >
          <MiniShape cells={dragShape.cells} color={dragShape.color} cellPx={(cellMetrics()?.cw ?? 40) * 0.9} />
        </div>
      )}

      {/* Game over / win overlay */}
      <AnimatePresence>
        {gameState.isGameOver && result && (
          <GameOverScreen
            theme={theme}
            result={result}
            onRestart={onRestart}
            onNext={onNextLevel}
            onMenu={onMenu}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MiniShape: React.FC<{ cells: { row: number; col: number }[]; color: string; cellPx: number }> = ({ cells, color, cellPx }) => {
  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const c of cells) {
    minR = Math.min(minR, c.row); maxR = Math.max(maxR, c.row);
    minC = Math.min(minC, c.col); maxC = Math.max(maxC, c.col);
  }
  const w = maxC - minC + 1, h = maxR - minR + 1;
  const set = new Set(cells.map(c => `${c.row}-${c.col}`));
  return (
    <div style={{ position: 'relative', width: w * (cellPx + 3), height: h * (cellPx + 3) }}>
      {cells.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: (c.col - minC) * (cellPx + 3),
            top: (c.row - minR) * (cellPx + 3),
            width: cellPx,
            height: cellPx,
            borderRadius: 6,
            background: set.has(`${c.row}-${c.col}`) ? color : 'transparent',
            boxShadow: `inset 0 1px 2px rgba(255,255,255,0.3), 0 4px 14px ${color}60`,
          }}
        />
      ))}
    </div>
  );
};
