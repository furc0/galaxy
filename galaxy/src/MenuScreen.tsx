import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Theme } from './types';
import { getUnlockedLevels, getTotalStars } from './levels';
import { loadDaily, todayKey, yesterdayKey, Stats } from './storage';

interface Props {
  theme: Theme;
  highScore: number;
  stats: Stats;
  onFreeGame: () => void;
  onContinueLevel: () => void;
  onLevels: () => void;
  onSettings: () => void;
  onDaily: () => void;
}

export const MenuScreen: React.FC<Props> = ({
  theme, highScore, stats, onFreeGame, onContinueLevel, onLevels, onSettings, onDaily,
}) => {
  const [pulse, setPulse] = useState(0);
  const unlocked = getUnlockedLevels();
  const totalStars = getTotalStars();
  const daily = loadDaily();
  const dailyDoneToday = !!daily && daily.date === todayKey() && daily.claimed;
  const dailyStreakAlive = !!daily && (daily.date === todayKey() || daily.date === yesterdayKey());

  useEffect(() => {
    const t = setInterval(() => setPulse(p => p + 1), 9000);
    return () => clearInterval(t);
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return 'Тихой ночи';
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  })();

  return (
    <motion.div
      className="flex flex-col items-center h-full px-6 pt-[12vh] pb-6 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo */}
      <motion.div
        className="text-center mb-6"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 160, damping: 20 }}
      >
        <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: theme.textSecondary }}>
          {greeting}
        </p>
        <h1 className="text-6xl font-extralight tracking-[0.25em]" style={{ color: theme.textPrimary }}>
          ПРИЗМА
        </h1>
        <motion.div
          className="h-px mt-3 mx-auto"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 180, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.9 }}
          style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }}
        />
      </motion.div>

      {/* Breathing orb */}
      <motion.div
        className="rounded-full mb-7"
        style={{
          width: 64, height: 64,
          background: `radial-gradient(circle at 35% 30%, ${theme.colors[0]}, ${theme.colors[2]} 70%)`,
          boxShadow: `0 0 44px ${theme.glowColor}`,
        }}
        animate={{ scale: [1, 1.08, 1], rotate: pulse * 360 % 360 + 0 }}
        transition={{ scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' }, rotate: { duration: 40, ease: 'linear' } }}
      />

      {/* Scores row */}
      {(highScore > 0 || totalStars > 0) && (
        <motion.div
          className="flex gap-10 mb-7 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: theme.textSecondary }}>Рекорд</p>
            <p className="text-xl font-light tabular-nums" style={{ color: theme.accent }}>{highScore.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: theme.textSecondary }}>Звёзды</p>
            <p className="text-xl font-light tabular-nums" style={{ color: theme.accent }}>★ {totalStars}</p>
          </div>
        </motion.div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-[300px]">
        <motion.button
          className="py-4 rounded-2xl text-lg font-medium tracking-wide"
          onClick={onFreeGame}
          whileTap={{ scale: 0.96 }}
          initial={{ x: -24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 180 }}
          style={{
            background: `linear-gradient(135deg, ${theme.accent}35, ${theme.accent}12)`,
            border: `1px solid ${theme.accent}50`,
            color: theme.textPrimary,
            boxShadow: `0 6px 28px ${theme.accent}25`,
          }}
        >
          Свободная игра
        </motion.button>

        <div className="flex gap-3">
          <motion.button
            className="flex-1 py-3.5 rounded-2xl text-base"
            onClick={onContinueLevel}
            whileTap={{ scale: 0.96 }}
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 180 }}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${theme.cellBorder}`,
              color: theme.textPrimary,
            }}
          >
            Уровень {Math.max(1, unlocked - 1)}
            <span className="block text-[10px] mt-0.5" style={{ color: theme.textSecondary }}>продолжить</span>
          </motion.button>

          <motion.button
            className="flex-1 py-3.5 rounded-2xl text-base relative"
            onClick={onDaily}
            whileTap={{ scale: 0.96 }}
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.48, type: 'spring', stiffness: 180 }}
            style={{
              background: dailyDoneToday ? 'rgba(255,255,255,0.02)' : `linear-gradient(135deg, ${theme.colors[3]}22, transparent)`,
              border: `1px solid ${dailyDoneToday ? theme.cellBorder : theme.colors[3] + '55'}`,
              color: theme.textPrimary,
            }}
          >
            Задание
            <span className="block text-[10px] mt-0.5" style={{ color: dailyStreakAlive ? theme.accent : theme.textSecondary }}>
              {dailyDoneToday ? 'выполнено ✓' : dailyStreakAlive ? 'не разрывай серию' : 'новый день'}
            </span>
          </motion.button>
        </div>

        <div className="flex gap-3 mt-1">
          <motion.button
            className="flex-1 py-3 rounded-2xl text-sm"
            onClick={onLevels}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ background: 'transparent', border: `1px solid ${theme.cellBorder}`, color: theme.textSecondary }}
          >
            Все уровни · {unlocked - 1}
          </motion.button>
          <motion.button
            className="py-3 px-5 rounded-2xl text-sm"
            onClick={onSettings}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.68 }}
            style={{ background: 'transparent', border: `1px solid ${theme.cellBorder}`, color: theme.textSecondary }}
          >
            ⚙
          </motion.button>
        </div>
      </div>

      <motion.p
        className="text-[10px] mt-auto tracking-wider"
        style={{ color: theme.textSecondary }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        партий: {stats.gamesPlayed} · линий: {stats.totalLines}
      </motion.p>

      {/* Ambient orbs — shift position with each pulse to keep the scene alive */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 140 + i * 50,
              height: 140 + i * 50,
              background: `radial-gradient(circle, ${theme.colors[i % theme.colors.length]}18, transparent 70%)`,
              left: `${(i * 23 + pulse * 7) % 90 - 5}%`,
              top: `${15 + (i % 3) * 26 + (i * 7) % 12}%`,
            }}
            animate={{ x: [0, 26, -14, 0], y: [0, -20, 12, 0], scale: [1, 1.12, 0.94, 1] }}
            transition={{ duration: 9 + i * 2.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
};
