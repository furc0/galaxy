import React from 'react';
import { motion } from 'framer-motion';
import { Theme } from './types';
import { themes } from './themes';
import { Settings, Stats, ACHIEVEMENTS, loadUnlockedAchievements } from './storage';

interface Props {
  theme: Theme;
  settings: Settings;
  stats: Stats;
  onSettingsChange: (patch: Partial<Settings>) => void;
  onThemeChange: (id: string) => void;
  onBack: () => void;
  onResetProgress: () => void;
}

const Section: React.FC<{ theme: Theme; title: string; children: React.ReactNode }> = ({ theme, title, children }) => (
  <div className="mb-6">
    <p className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: theme.textSecondary }}>{title}</p>
    {children}
  </div>
);

const Toggle: React.FC<{ theme: Theme; label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }> = ({
  theme, label, hint, value, onChange,
}) => (
  <button
    onClick={() => onChange(!value)}
    className="w-full flex items-center justify-between py-2.5 px-1 text-left"
  >
    <span>
      <span className="text-sm block" style={{ color: theme.textPrimary }}>{label}</span>
      {hint && <span className="text-[10px] block" style={{ color: theme.textSecondary }}>{hint}</span>}
    </span>
    <span
      className="relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0"
      style={{ background: value ? `${theme.accent}55` : 'rgba(255,255,255,0.08)', border: `1px solid ${value ? theme.accent + '80' : theme.cellBorder}` }}
    >
      <motion.span
        layout
        className="absolute top-0.5 w-5 h-5 rounded-full"
        style={{ left: value ? 26 : 3, background: value ? theme.accent : 'rgba(255,255,255,0.35)' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </span>
  </button>
);

export const SettingsScreen: React.FC<Props> = ({
  theme, settings, stats, onSettingsChange, onThemeChange, onBack, onResetProgress,
}) => {
  const unlocked = loadUnlockedAchievements();
  const highScore = parseInt(localStorage.getItem('prism_highscore') || '0');

  return (
    <motion.div
      className="flex flex-col h-full px-6 pt-4 pb-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <motion.button
          onClick={onBack}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.cellBorder}`, color: theme.textPrimary }}
        >
          ←
        </motion.button>
        <h2 className="text-xl font-light tracking-wider" style={{ color: theme.textPrimary }}>Настройки</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto pr-1" style={{ overscrollBehavior: 'contain' }}>
        {/* Sound & haptics */}
        <Section theme={theme} title="Игра">
          <div style={{ borderTop: `1px solid ${theme.cellBorder}` }}>
            <Toggle
              theme={theme}
              label="Звук"
              hint="Процедурные эффекты без файлов"
              value={settings.sound}
              onChange={v => onSettingsChange({ sound: v })}
            />
            <div style={{ borderTop: `1px solid ${theme.cellBorder}` }}>
              <Toggle
                theme={theme}
                label="Вибрация"
                hint="Отклик на касания (на телефоне)"
                value={settings.haptics}
                onChange={v => onSettingsChange({ haptics: v })}
              />
            </div>
          </div>
        </Section>

        {/* Theme selection */}
        <Section theme={theme} title="Тема">
          <div className="flex gap-2.5 flex-wrap">
            <motion.button
              key="auto"
              className="w-14 h-14 rounded-xl flex flex-col items-center justify-center relative overflow-hidden"
              onClick={() => onThemeChange('auto')}
              whileTap={{ scale: 0.9 }}
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                border: `2px solid ${settings.themeMode === 'auto' ? theme.accent : 'transparent'}`,
                boxShadow: settings.themeMode === 'auto' ? `0 0 12px ${theme.accent}40` : 'none',
              }}
            >
              <span className="text-lg" style={{ color: theme.textPrimary }}>∞</span>
              <span className="text-[8px]" style={{ color: theme.textSecondary }}>авто</span>
            </motion.button>
            {themes.map(t => (
              <motion.button
                key={t.id}
                className="w-14 h-14 rounded-xl flex items-center justify-center relative overflow-hidden"
                onClick={() => onThemeChange(t.id)}
                whileTap={{ scale: 0.9 }}
                style={{
                  background: t.bgGradient,
                  border: `2px solid ${settings.themeMode === t.id ? t.accent : 'transparent'}`,
                  boxShadow: settings.themeMode === t.id ? `0 0 12px ${t.accent}40` : 'none',
                }}
              >
                <div className="w-4 h-4 rounded-full" style={{ background: t.accent, boxShadow: `0 0 8px ${t.accent}` }} />
                <span className="absolute bottom-1 text-[8px]" style={{ color: t.textSecondary }}>{t.name}</span>
              </motion.button>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: theme.textSecondary }}>
            «Авто» — тема плавно меняется по мере прогресса в партии.
          </p>
        </Section>

        {/* Stats */}
        <Section theme={theme} title="Статистика">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ['Рекорд', highScore.toLocaleString()],
              ['Партий', String(stats.gamesPlayed)],
              ['Линий всего', String(stats.totalLines)],
              ['Лучшее комбо', `×${stats.bestCombo}`],
              ['Ежедневных', String(stats.dailyDone)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${theme.cellBorder}` }}>
                <span className="text-xs" style={{ color: theme.textSecondary }}>{k}</span>
                <span className="text-xs font-light tabular-nums" style={{ color: theme.textPrimary }}>{v}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Achievements */}
        <Section theme={theme} title={`Достижения · ${unlocked.size}/${ACHIEVEMENTS.length}`}>
          <div className="space-y-2">
            {ACHIEVEMENTS.map(a => {
              const got = unlocked.has(a.id);
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2"
                  style={{
                    background: got ? `${theme.accent}12` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${got ? theme.accent + '45' : theme.cellBorder}`,
                  }}
                >
                  <span className="text-base shrink-0" style={{ filter: got ? 'none' : 'grayscale(1)', opacity: got ? 1 : 0.4 }}>🏆</span>
                  <span className="min-w-0">
                    <span className="text-xs block truncate" style={{ color: got ? theme.textPrimary : theme.textSecondary }}>{a.name}</span>
                    <span className="text-[10px] block truncate" style={{ color: theme.textSecondary }}>{a.desc}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Reset */}
        <div className="mt-2 mb-4">
          <motion.button
            className="w-full py-3 rounded-xl text-sm"
            onClick={() => {
              if (window.confirm('Сбросить весь прогресс, рекорды и достижения?')) onResetProgress();
            }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'rgba(255,50,50,0.05)',
              border: '1px solid rgba(255,50,50,0.2)',
              color: 'rgba(255,100,100,0.7)',
            }}
          >
            Сбросить прогресс
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
