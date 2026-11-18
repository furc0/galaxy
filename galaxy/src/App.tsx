import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GameScreen } from './GameScreen';
import { MenuScreen } from './MenuScreen';
import { LevelsScreen } from './LevelsScreen';
import { SettingsScreen } from './SettingsScreen';
import { useGame } from './useGame';
import { themes } from './themes';
import { loadStats, loadSettings, saveSettings, Settings, Stats } from './storage';
import { getUnlockedLevels } from './levels';

type Screen = 'menu' | 'game' | 'levels' | 'settings';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [stats, setStats] = useState<Stats>(() => loadStats());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [, forceHud] = useState(0); // re-render to refresh localStorage-derived HUD values

  const {
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
  } = useGame();

  // Theme: 'auto' shifts with progress while playing; otherwise a fixed theme id
  const autoThemeIndex = Math.max(0, themes.findIndex(t => t.id === currentTheme.id));
  const manualThemeIndex = Math.max(0, themes.findIndex(t => t.id === settings.themeMode));
  const activeTheme =
    screen === 'game' && gameState
      ? currentTheme
      : themes[settings.themeMode === 'auto' ? autoThemeIndex : manualThemeIndex];

  const handleThemeChange = useCallback((id: string) => {
    const s = { ...loadSettings(), themeMode: id };
    saveSettings(s);
    setSettings(s);
  }, []);

  const handleSettingsChange = useCallback((patch: Partial<Settings>) => {
    const s = { ...loadSettings(), ...patch };
    saveSettings(s);
    setSettings(s);
  }, []);

  const refreshStats = useCallback(() => setStats(loadStats()), []);

  const handleFreeGame = useCallback(() => {
    startFreeGame();
    setScreen('game');
  }, [startFreeGame]);

  const handleSelectLevel = useCallback((levelId: number) => {
    startLevel(levelId);
    setScreen('game');
  }, [startLevel]);

  const handleContinueLevel = useCallback(() => {
    startLevel(Math.max(1, getUnlockedLevels()));
    setScreen('game');
  }, [startLevel]);

  const handleDaily = useCallback(() => {
    startDaily();
    setScreen('game');
  }, [startDaily]);

  const handleRestart = useCallback(() => {
    if (result?.mode === 'level' && result.level != null) startLevel(result.level);
    else if (result?.mode === 'daily') startDaily();
    else startFreeGame();
  }, [result, startLevel, startDaily, startFreeGame]);

  const handleNextLevel = useCallback(() => {
    if (result?.mode === 'level' && result.level != null) startLevel(result.level + 1);
  }, [result, startLevel]);

  const handleMenu = useCallback(() => {
    resetGame();
    refreshStats();
    forceHud(v => v + 1);
    setScreen('menu');
  }, [resetGame, refreshStats]);

  const handleResetProgress = useCallback(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('prism_')) localStorage.removeItem(key);
    }
    saveSettings(settings); // keep user's sound/haptics/theme preferences
    refreshStats();
    forceHud(v => v + 1);
  }, [refreshStats, settings]);

  return (
    <div
      className="w-full h-full overflow-hidden relative transition-all duration-1000"
      style={{ background: activeTheme.bgGradient }}
    >
      {/* Ambient background animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[200%] h-[200%] -left-1/2 -top-1/2"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          style={{
            background: `radial-gradient(ellipse at 30% 50%, ${activeTheme.accent}08 0%, transparent 50%),
                         radial-gradient(ellipse at 70% 50%, ${activeTheme.colors[1]}06 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Screen content */}
      <div className="relative z-10 h-full">
        <AnimatePresence mode="wait">
          {screen === 'menu' && (
            <MenuScreen
              key="menu"
              theme={activeTheme}
              highScore={parseInt(localStorage.getItem('prism_highscore') || '0')}
              stats={stats}
              onFreeGame={handleFreeGame}
              onContinueLevel={handleContinueLevel}
              onLevels={() => setScreen('levels')}
              onSettings={() => setScreen('settings')}
              onDaily={handleDaily}
            />
          )}

          {screen === 'game' && gameState && (
            <GameScreen
              key="game"
              gameState={gameState}
              theme={activeTheme}
              clearedCells={clearedCells}
              showCombo={showCombo}
              lastScore={lastScore}
              result={result}
              onPlaceShape={placeShapeAt}
              onRestart={handleRestart}
              onNextLevel={result?.won && result.mode === 'level' ? handleNextLevel : null}
              onMenu={handleMenu}
              onGameFinished={refreshStats}
            />
          )}

          {screen === 'levels' && (
            <LevelsScreen
              key="levels"
              theme={activeTheme}
              onSelectLevel={handleSelectLevel}
              onBack={() => setScreen('menu')}
            />
          )}

          {screen === 'settings' && (
            <SettingsScreen
              key="settings"
              theme={activeTheme}
              settings={settings}
              stats={stats}
              onSettingsChange={handleSettingsChange}
              onThemeChange={handleThemeChange}
              onBack={() => setScreen('menu')}
              onResetProgress={handleResetProgress}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Achievement toasts */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none w-[92%] max-w-[340px]">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.92 }}
              className="rounded-2xl px-4 py-2.5 text-center backdrop-blur-md"
              style={{
                background: 'rgba(10,14,24,0.85)',
                border: `1px solid ${activeTheme.accent}60`,
                boxShadow: `0 8px 30px rgba(0,0,0,0.4), 0 0 20px ${activeTheme.accent}30`,
              }}
            >
              <p className="text-sm font-medium" style={{ color: activeTheme.textPrimary }}>🏆 {t.text}</p>
              {t.sub && (
                <p className="text-[11px] mt-0.5" style={{ color: activeTheme.textSecondary }}>{t.sub}</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
