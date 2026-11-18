import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Theme } from './types';
import { getLevelById, getUnlockedLevels, getLevelStars, getTotalStars, PrismLevel } from './levels';

interface Props {
  theme: Theme;
  onSelectLevel: (id: number) => void;
  onBack: () => void;
}

const PAGE = 30;

export const LevelsScreen: React.FC<Props> = ({ theme, onSelectLevel, onBack }) => {
  const [page, setPage] = useState(() => Math.floor((getUnlockedLevels() - 1) / PAGE));
  const unlocked = getUnlockedLevels();
  const start = page * PAGE + 1;
  const ids = Array.from({ length: PAGE }, (_, i) => start + i);

  return (
    <motion.div
      className="flex flex-col h-full px-4 pt-4"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <motion.button
          onClick={onBack}
          whileTap={{ scale: 0.9 }}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.cellBorder}`, color: theme.textSecondary }}
        >
          ←
        </motion.button>
        <div className="text-center">
          <h2 className="text-xl font-light tracking-wider" style={{ color: theme.textPrimary }}>Уровни</h2>
          <p className="text-[10px]" style={{ color: theme.accent }}>★ {getTotalStars()} звёзд всего</p>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto pb-6" style={{ overscrollBehavior: 'contain' }}>
        <div className="grid grid-cols-4 gap-2.5">
          {ids.map((id, i) => {
            const isUnlocked = id <= unlocked;
            const stars = getLevelStars(id);
            const lvl: PrismLevel = getLevelById(id);
            const isBoss = lvl.boss !== null;
            return (
              <motion.button
                key={id}
                disabled={!isUnlocked}
                onClick={() => isUnlocked && onSelectLevel(id)}
                whileTap={isUnlocked ? { scale: 0.9 } : undefined}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: isUnlocked ? 1 : 0.35, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className="relative aspect-square rounded-2xl flex flex-col items-center justify-center"
                style={{
                  background: isBoss && isUnlocked
                    ? `linear-gradient(150deg, ${theme.colors[(id / 10 | 0) % theme.colors.length]}20, rgba(255,255,255,0.03))`
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${id === unlocked ? theme.accent + '80' : theme.cellBorder}`,
                  boxShadow: id === unlocked ? `0 0 18px ${theme.accent}30` : 'none',
                }}
              >
                <span className="text-lg font-light tabular-nums" style={{ color: theme.textPrimary }}>
                  {isUnlocked ? id : '🔒'}
                </span>
                {isUnlocked && (
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3].map(s => (
                      <span key={s} className="text-[9px]" style={{ color: s <= stars ? theme.accent : 'rgba(255,255,255,0.12)' }}>★</span>
                    ))}
                  </div>
                )}
                {isBoss && isUnlocked && (
                  <span className="absolute top-1 right-1.5 text-[8px] uppercase tracking-wide" style={{ color: theme.accent }}>босс</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 py-3">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          className="px-4 py-2 rounded-xl text-sm disabled:opacity-30"
          style={{ border: `1px solid ${theme.cellBorder}`, color: theme.textSecondary }}
        >←</button>
        <span className="text-xs tabular-nums" style={{ color: theme.textSecondary }}>
          {start}–{start + PAGE - 1}
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          className="px-4 py-2 rounded-xl text-sm"
          style={{ border: `1px solid ${theme.cellBorder}`, color: theme.textSecondary }}
        >→</button>
      </div>
    </motion.div>
  );
};
