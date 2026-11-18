import { useState, useCallback, useRef } from 'react';
import { GameState, Position, Shape, GameMode } from './types';
import { themes } from './themes';
import {
  createEmptyGrid, createEmptyColorGrid, applyBlockedCells,
  canPlaceShape, placeShape, findCompletedLines, clearLines,
  calculateScore, canAnyShapeBePlaced, getDifficultyForLevel,
} from './gameLogic';
import { generateShapes } from './shapes';
import { getLevelById, getBlockedCells, unlockLevel, calculateStars, setLevelStars } from './levels';
import { loadSettings, ACHIEVEMENTS } from './storage';

export interface GameResult {
  won: boolean;
  stars: number;
  score: number;
  lines: number;
  maxCombo: number;
  mode: GameMode;
  level: number | null;
  newBest: boolean;
}

export interface Toast { id: number; text: string; sub?: string }

let toastId = 0;

export function useGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [clearedCells, setClearedCells] = useState<Position[]>([]);
  const [showCombo, setShowCombo] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const resolvingRef = useRef(false);

  const pushToast = useCallback((text: string, sub?: string) => {
    const id = ++toastId;
    setToasts(t => [...t, { id, text, sub }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  }, []);

  const checkAchievements = useCallback(() => {
    const stats = loadStats();
    const hs = parseInt(localStorage.getItem('prism_highscore') || '0');
    const unlocked = parseInt(localStorage.getItem('prism_unlocked_levels') || '1');
    const key = 'prism_achievements_v1';
    let got: string[] = [];
    try { got = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    const set = new Set(got);
    // lazy import to avoid cycle issues at module top
    import('./storage').then(({ ACHIEVEMENTS }) => {
      for (const a of ACHIEVEMENTS) {
        if (!set.has(a.id) && a.check(stats, hs, unlocked)) {
          set.add(a.id);
          pushToast(`Достижение: ${a.name}`, a.desc);
          playAchievement();
        }
      }
      localStorage.setItem(key, JSON.stringify([...set]));
    });
  }, [pushToast]);

  const themeIndexForProgress = useCallback((totalLines: number): number => {
    return Math.floor(totalLines / 4) % themes.length;
  }, []);

  const currentTheme = gameState
    ? themes[themeIndexForProgress(gameState.totalLinesCleared)]
    : themes[0];

  const buildInitial = useCallback((mode: GameMode, levelId: number | null): GameState => {
    let blocked = new Set<string>();
    let difficulty = 1;
    let colors = themes[0].colors;
    let rng: () => number = Math.random;

    if (mode === 'level' && levelId) {
      const lvl = getLevelById(levelId);
      blocked = getBlockedCells(lvl);
      difficulty = getDifficultyForLevel(levelId);
      colors = themes[lvl.themeIndex].colors;
    } else if (mode === 'daily') {
      const seed = hashString('daily-' + todayKey());
      rng = mulberry32(seed);
      difficulty = 7;
      colors = themes[Math.floor(rng() * themes.length)].colors;
    }

    const grid = applyBlockedCells(createEmptyGrid(), blocked);
    return {
      grid,
      gridColors: createEmptyColorGrid(),
      score: 0,
      highScore: parseInt(localStorage.getItem('prism_highscore') || '0'),
      combo: 0,
      maxCombo: 0,
      shapes: generateShapes(3, colors, difficulty, rng),
      isGameOver: false,
      linesCleared: 0,
      totalLinesCleared: 0,
      level: levelId,
      mode,
    };
  }, []);

  const startFreeGame = useCallback(() => {
    setResult(null);
    setGameState(buildInitial('free', null));
  }, [buildInitial]);

  const startLevel = useCallback((levelId: number) => {
    setResult(null);
    setGameState(buildInitial('level', levelId));
  }, [buildInitial]);

  const startDaily = useCallback(() => {
    setResult(null);
    setGameState(buildInitial('daily', null));
  }, [buildInitial]);

  const finalizeGame = useCallback((gs: GameState, won: boolean) => {
    const stats: Stats = loadStats();
    stats.gamesPlayed += 1;
    stats.totalScore += gs.score;
    stats.totalLines += gs.linesCleared;
    stats.bestCombo = Math.max(stats.bestCombo, gs.maxCombo);

    let stars = 0;
    if (gs.mode === 'level' && gs.level) {
      const lvl = getLevelById(gs.level);
      if (won) {
        stars = calculateStars(gs.score, lvl.targetScore);
        setLevelStars(gs.level, stars);
        unlockLevel(gs.level + 1);
        if (gs.level >= 10) stats.level10 = true;
        if (gs.level >= 25) stats.level25 = true;
        if (gs.level >= 50) stats.level50 = true;
        if (gs.level >= 100) stats.level100 = true;
      }
    }

    if (gs.mode === 'daily') {
      const target = 1000;
      const prev = loadDaily();
      if (!prev || prev.date !== todayKey()) {
        saveDaily({ date: todayKey(), score: gs.score, lines: gs.linesCleared, claimed: won, streakBroken: false });
      } else if (won && !prev.claimed) {
        saveDaily({ ...prev, score: Math.max(prev.score, gs.score), lines: Math.max(prev.lines, gs.linesCleared), claimed: true });
      }
      if (won) stats.dailyDone += 1;
      if (gs.score >= target) stars = 3; else if (won) stars = 2; else stars = 1;
    }

    saveStats(stats);
    const newBest = gs.mode === 'free' && gs.score >= parseInt(localStorage.getItem('prism_highscore') || '0') && gs.score > 0;
    setResult({ won, stars, score: gs.score, lines: gs.linesCleared, maxCombo: gs.maxCombo, mode: gs.mode, level: gs.level, newBest });
    if (won) playLevelWin(); else playGameOverSound();
    checkAchievements();
  }, [checkAchievements]);

  const placeShapeAt = useCallback((shapeIndex: number, position: Position): boolean => {
    if (!gameState || gameState.isGameOver || resolvingRef.current) return false;

    const shape = gameState.shapes[shapeIndex];
    if (!shape) return false;
    if (!canPlaceShape(gameState.grid, shape, position)) return false;

    playPlaceSound();

    const { newGrid, newColorGrid } = placeShape(gameState.grid, gameState.gridColors, shape, position);
    const { rows, cols } = findCompletedLines(newGrid);
    const totalLines = rows.length + cols.length;

    // Update shapes tray
    const updatedShapes: (Shape | null)[] = gameState.shapes.map((s, i) => (i === shapeIndex ? null : s));
    const allUsed = updatedShapes.every(s => s === null);
    let nextShapes = updatedShapes;
    if (allUsed) {
      const newTotal = gameState.totalLinesCleared + totalLines;
      const difficulty = gameState.mode === 'level' && gameState.level
        ? getDifficultyForLevel(gameState.level)
        : gameState.mode === 'daily'
          ? 7
          : Math.min(Math.floor(newTotal / 4) + 1, 12);
      const colors = themes[themeIndexForProgress(newTotal)].colors;
      nextShapes = generateShapes(3, colors, difficulty);
    }

    const placedCells = shape.cells.length;
    const newCombo = totalLines > 0 ? gameState.combo + 1 : 0;
    const scoreGain = totalLines > 0 ? calculateScore(totalLines, newCombo, placedCells) : placedCells;
    const newScore = gameState.score + scoreGain;

    // Best score (free mode) is persisted globally; level/daily runs keep it locally in state
    let highScore = gameState.highScore;
    if (newScore > highScore) {
      highScore = newScore;
      if (gameState.mode === 'free') localStorage.setItem('prism_highscore', highScore.toString());
    }

    const baseState: GameState = {
      ...gameState,
      grid: newGrid,
      gridColors: newColorGrid,
      score: newScore,
      highScore,
      combo: newCombo,
      maxCombo: Math.max(gameState.maxCombo, newCombo),
      shapes: nextShapes,
      linesCleared: gameState.linesCleared + totalLines,
      totalLinesCleared: gameState.totalLinesCleared + totalLines,
    };

    if (totalLines > 0) {
      // Show clearing animation: keep filled grid visible, mark cells as clearing
      const { newGrid: clearedGrid, newColorGrid: clearedColorGrid, cellsCleared } = clearLines(newGrid, newColorGrid, rows, cols);
      setClearedCells(cellsCleared);
      setLastScore(scoreGain);
      setShowCombo(true);
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      comboTimeoutRef.current = setTimeout(() => setShowCombo(false), 1500);
      playClearSound(newCombo);
      if (newCombo > 1) playComboSound(newCombo);

      resolvingRef.current = true;
      setGameState(baseState);

      setTimeout(() => {
        setClearedCells([]);
        const finalState: GameState = { ...baseState, grid: clearedGrid, gridColors: clearedColorGrid };
        const levelWon = finalState.mode === 'level' && finalState.level != null
          && finalState.linesCleared >= getLevelById(finalState.level).linesToClear;
        const dailyWon = finalState.mode === 'daily' && finalState.linesCleared >= 5;
        const over = !levelWon && !dailyWon && !canAnyShapeBePlaced(clearedGrid, finalState.shapes);
        finalState.isGameOver = over || levelWon || dailyWon;
        resolvingRef.current = false;
        setGameState(finalState);
        if (finalState.isGameOver) finalizeGame(finalState, levelWon || dailyWon);
      }, 420);
      return true;
    }

    // No line cleared
    setLastScore(scoreGain);
    const levelWon = baseState.mode === 'level' && baseState.level != null
      && baseState.linesCleared >= getLevelById(baseState.level).linesToClear;
    const dailyWon = baseState.mode === 'daily' && baseState.linesCleared >= 5;
    const over = !canAnyShapeBePlaced(newGrid, nextShapes);
    baseState.isGameOver = over || levelWon || dailyWon;

    setGameState(baseState);
    if (baseState.isGameOver) finalizeGame(baseState, levelWon || dailyWon);
    return true;
  }, [gameState, finalizeGame, themeIndexForProgress]);

  const resetGame = useCallback(() => {
    setGameState(null);
    setClearedCells([]);
    setShowCombo(false);
    setLastScore(0);
    setResult(null);
    resolvingRef.current = false;
  }, []);

  return {
    gameState,
    currentTheme,
    clearedCells,
    showCombo,
    lastScore,
    result,
    toasts,
    startFreeGame,
    startLevel,
    startDaily,
    placeShapeAt,
    resetGame,
  };
}
