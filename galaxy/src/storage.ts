// Local persistence: settings, stats, daily challenges, achievements

export interface Settings {
  sound: boolean;
  haptics: boolean;
  themeMode: 'auto' | string; // 'auto' = theme shifts while playing; otherwise theme id
}

export interface Stats {
  gamesPlayed: number;
  totalScore: number;
  totalLines: number;
  bestCombo: number;
  level10: boolean;
  level25: boolean;
  level50: boolean;
  level100: boolean;
  dailyDone: number; // count of distinct days completed
}

const K_SETTINGS = 'prism_settings_v1';
const K_STATS = 'prism_stats_v1';
const K_DAILY = 'prism_daily_v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(K_SETTINGS);
    if (raw) return { sound: true, haptics: true, themeMode: 'auto', ...JSON.parse(raw) };
  } catch {}
  return { sound: true, haptics: true, themeMode: 'auto' };
}

export function saveSettings(s: Settings) {
  try { localStorage.setItem(K_SETTINGS, JSON.stringify(s)); } catch {}
}

export function loadStats(): Stats {
  const def: Stats = {
    gamesPlayed: 0, totalScore: 0, totalLines: 0, bestCombo: 0,
    level10: false, level25: false, level50: false, level100: false, dailyDone: 0,
  };
  try {
    const raw = localStorage.getItem(K_STATS);
    if (raw) return { ...def, ...JSON.parse(raw) };
  } catch {}
  return def;
}

export function saveStats(s: Stats) {
  try { localStorage.setItem(K_STATS, JSON.stringify(s)); } catch {}
}

export interface DailyRecord {
  date: string;        // YYYY-MM-DD local
  score: number;
  lines: number;
  claimed: boolean;    // stars awarded
  streakBroken: boolean;
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

export function loadDaily(): DailyRecord | null {
  try {
    const raw = localStorage.getItem(K_DAILY);
    if (raw) return JSON.parse(raw) as DailyRecord;
  } catch {}
  return null;
}

export function saveDaily(r: DailyRecord) {
  try { localStorage.setItem(K_DAILY, JSON.stringify(r)); } catch {}
}

// deterministic PRNG (mulberry32)
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  check: (s: Stats, highScore: number, unlocked: number) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first',   name: 'Первый свет',     desc: 'Сыграй первую партию',           check: s => s.gamesPlayed >= 1 },
  { id: 'combo5',  name: 'В потоке',        desc: 'Комбо x5 за одну партию',        check: s => s.bestCombo >= 5 },
  { id: 'lines100',name: 'Линейный маг',    desc: 'Очисти 100 линий всего',         check: s => s.totalLines >= 100 },
  { id: 'score5k', name: 'Полночь',         desc: 'Набери 5 000 в свободном режиме',check: (_, hs) => hs >= 5000 },
  { id: 'score15k',name: 'Сверхновая',      desc: 'Набери 15 000 в свободном режиме',check: (_, hs) => hs >= 15000 },
  { id: 'lvl10',   name: 'Десяточка',       desc: 'Пройди уровень 10',              check: s => s.level10 },
  { id: 'lvl25',   name: 'Четверть пути',   desc: 'Пройди уровень 25',              check: s => s.level25 },
  { id: 'lvl50',   name: 'Половина',        desc: 'Пройди уровень 50',              check: s => s.level50 },
  { id: 'lvl100',  name: 'Сотня',           desc: 'Пройди уровень 100',             check: s => s.level100 },
  { id: 'daily',   name: 'Ритуал',          desc: 'Выполни ежедневное задание',     check: s => s.dailyDone >= 1 },
  { id: 'daily5',  name: 'Привычка',        desc: '5 ежедневных заданий',           check: s => s.dailyDone >= 5 },
  { id: 'games25', name: 'Завсегдатай',     desc: '25 партий',                      check: s => s.gamesPlayed >= 25 },
];

export function loadUnlockedAchievements(): Set<string> {
  try {
    const raw = localStorage.getItem('prism_achievements_v1');
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

export function saveUnlockedAchievements(set: Set<string>) {
  try { localStorage.setItem('prism_achievements_v1', JSON.stringify([...set])); } catch {}
}
