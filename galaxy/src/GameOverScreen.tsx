import React from 'react';
import { motion } from 'framer-motion';
import { Theme } from './types';
import { GameResult } from './useGame';
import { getLevelById, getUnlockedLevels } from './levels';

interface Props {
  theme: Theme;
  result: GameResult;
  onRestart: () => void;
  onNext: (() => void) | null;
  onMenu: () => void;
}

export const GameOverScreen: React.FC<Props> = ({ theme, result, onRestart, onNext, onMenu }) => {
  const isWin = result.won;
  const title = isWin
    ? result.mode === 'daily'
      ? 'Задание выполнено'
      : `Уровень ${result.level} пройден`
    : result.mode === 'free'
      ? 'Ходов больше нет'
      : 'Поле заполнено';

  const levelTarget = result.mode === 'level' && result.level ? getLevelById(result.level).targetScore : 0;

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-50 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ background: 'rgba(5,8,15,0.72)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        className="text-center w-full max-w-[320px] rounded-3xl p-6"
        initial={{ y: 40, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 24 }}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${theme.cellBorder}`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${theme.glowColor}`,
        }}
      >
        {/* Stars */}
        {isWin && result.mode === 'level' && (
          <div className="flex justify-center gap-3 mb-4">
            {[1, 2, 3].map(s => (
              <motion.div
                key={s}
                initial={{ scale: 0, rotate: -120 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4 + s * 0.25, type: 'spring', stiffness: 300, damping: 15 }}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: s <= result.stars ? `${theme.accent}25` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${s <= result.stars ? theme.accent + '60' : theme.cellBorder}`,
                  color: s <= result.stars ? theme.accent : theme.textSecondary,
                  fontSize: 16,
                  boxShadow: s <= result.stars ? `0 0 16px ${theme.accent}50` : 'none',
                }}
              >★</motion.div>
            ))}
          </div>
        )}

        {result.newBest && (
          <motion.p
            className="text-xs uppercase tracking-widest mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{ color: theme.accent }}
          >
            ✦ Новый рекорд ✦
          </motion.p>
        )}

        <h2 className="text-2xl font-light tracking-wide mb-1" style={{ color: theme.textPrimary }}>
          {title}
        </h2>

        <motion.p
          className="text-5xl font-extralight tabular-nums my-4"
          style={{ color: theme.textPrimary }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 260 }}
        >
          {result.score.toLocaleString()}
        </motion.p>

        <div className="flex justify-center gap-8 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>Линий</p>
            <p className="text-lg font-light" style={{ color: theme.textPrimary }}>{result.lines}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>Комбо</p>
            <p className="text-lg font-light" style={{ color: theme.accent }}>×{result.maxCombo}</p>
          </div>
          {result.mode === 'level' && (
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>Цель</p>
              <p className="text-lg font-light" style={{ color: theme.textSecondary }}>{levelTarget.toLocaleString()}</p>
            </div>
          )}
        </div>

        {result.mode === 'daily' && (
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: theme.textSecondary }}>
            ★ {result.stars} / 3 · цель 1 000 очков
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          {isWin && onNext && (
            <motion.button
              className="py-3.5 rounded-2xl text-base font-medium tracking-wide"
              onClick={onNext}
              whileTap={{ scale: 0.95 }}
              style={{
                background: `linear-gradient(135deg, ${theme.accent}45, ${theme.accent}20)`,
                border: `1px solid ${theme.accent}60`,
                color: theme.textPrimary,
                boxShadow: `0 4px 24px ${theme.accent}30`,
              }}
            >
              Уровень {(result.level ?? 0) + 1} →
            </motion.button>
          )}
          {!isWin && (
            <motion.button
              className="py-3.5 rounded-2xl text-base font-medium tracking-wide"
              onClick={onRestart}
              whileTap={{ scale: 0.95 }}
              style={{
                background: `linear-gradient(135deg, ${theme.accent}45, ${theme.accent}20)`,
                border: `1px solid ${theme.accent}60`,
                color: theme.textPrimary,
              }}
            >
              Ещё раз
            </motion.button>
          )}
          {isWin && result.mode !== 'level' && (
            <motion.button
              className="py-3.5 rounded-2xl text-base font-medium tracking-wide"
              onClick={onRestart}
              whileTap={{ scale: 0.95 }}
              style={{
                background: `linear-gradient(135deg, ${theme.accent}45, ${theme.accent}20)`,
                border: `1px solid ${theme.accent}60`,
                color: theme.textPrimary,
              }}
            >
              Играть снова
            </motion.button>
          )}
          <motion.button
            className="py-3 rounded-2xl text-sm tracking-wide"
            onClick={onMenu}
            whileTap={{ scale: 0.95 }}
            style={{ background: 'transparent', border: `1px solid ${theme.cellBorder}`, color: theme.textSecondary }}
          >
            В меню
          </motion.button>
        </div>

        {result.mode === 'daily' && !isWin && (
          <p className="text-[11px] mt-4" style={{ color: theme.textSecondary }}>
            Следующее поле — завтра
          </p>
        )}
        {result.mode === 'level' && !isWin && result.level != null && result.level > getUnlockedLevels() && (
          <p className="text-[11px] mt-3" style={{ color: theme.textSecondary }}>Подсказка: береги большие фигуры для чистых рядов</p>
        )}
      </motion.div>
    </motion.div>
  );
};
