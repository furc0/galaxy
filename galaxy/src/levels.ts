import { Level } from './types';
import { mulberry32, hashString } from './storage';

// Levels are generated deterministically — infinite campaign.
// Every 10th level is a "boss" level with a special rule.

export type BossRule = 'corners' | 'cross' | 'edges' | 'sparse' | null;

export interface PrismLevel extends Level {
  boss: BossRule;
  themeIndex: number;
}

const NAMES_A = ['Первый', 'Тихий', 'Дальний', 'Янтарный', 'Лунный', 'Поздний', 'Северный', 'Мятный', 'Глубокий', 'Быстрый'];
const NAMES_B = ['свет', 'прилив', 'рассвет', 'поток', 'полдень', 'закат', 'эхо', 'ливень', 'туман', 'гром'];

function nameFor(id: number): string {
  const rnd = mulberry32(hashString(`name-${id}`));
  const a = NAMES_A[Math.floor(rnd() * NAMES_A.length)];
  const b = NAMES_B[Math.floor(rnd() * NAMES_B.length)];
  return `${a} ${b}`;
}

const BOSSES: BossRule[] = ['corners', 'cross', 'edges', 'sparse'];

export function getLevelById(id: number): PrismLevel {
  const tier = Math.floor((id - 1) / 5);
  const isBoss = id % 10 === 0;
  const boss: BossRule = isBoss ? BOSSES[(id / 10 - 1) % BOSSES.length] : null;

  const linesToClear = 3 + Math.min(9, Math.floor(id / 4));
  const targetScore = Math.round((linesToClear * 260 + id * 40) / 10) * 10;

  let description = `Очисти ${linesToClear} линий`;
  if (isBoss) {
    if (boss === 'corners') description = 'Босс: не заполняй углы!';
    else if (boss === 'cross') description = 'Босс: крест в центре заблокирован';
    else if (boss === 'edges') description = 'Босс: края поля сужены';
    else if (boss === 'sparse') description = 'Босс: поле с разломами';
  } else if (tier >= 8) description += ' · фигуры крупные';
  else if (tier >= 4) description += ' · фигуры растут';

  return {
    id,
    name: nameFor(id),
    gridSize: 8,
    targetScore,
    linesToClear,
    shapesPerRound: 3,
    description,
    boss,
    themeIndex: Math.floor((id - 1) / 4) % 5,
  };
}

// Cells that are blocked (permanently unusable) for a level
export function getBlockedCells(level: PrismLevel): Set<string> {
  const set = new Set<string>();
  const size = level.gridSize;
  switch (level.boss) {
    case 'corners':
      set.add('0-0'); set.add(`0-${size - 1}`);
      set.add(`${size - 1}-0`); set.add(`${size - 1}-${size - 1}`);
      break;
    case 'cross': {
      const c = Math.floor(size / 2);
      for (let i = c - 1; i <= c; i++) {
        for (let j = c - 1; j <= c; j++) set.add(`${i}-${j}`);
      }
      break;
    }
    case 'edges':
      for (let i = 0; i < size; i++) {
        set.add(`0-${i}`); set.add(`${size - 1}-${i}`);
        set.add(`${i}-0`); set.add(`${i}-${size - 1}`);
      }
      break;
    case 'sparse': {
      const rnd = mulberry32(hashString(`sparse-${level.id}`));
      for (let r = 1; r < size - 1; r++) {
        for (let c = 1; c < size - 1; c++) {
          if (rnd() < 0.12) set.add(`${r}-${c}`);
        }
      }
      break;
    }
    default:
      break;
  }
  return set;
}

export function getUnlockedLevels(): number {
  const unlocked = localStorage.getItem('prism_unlocked_levels');
  return unlocked ? parseInt(unlocked) : 1;
}

export function unlockLevel(id: number): void {
  const current = getUnlockedLevels();
  if (id > current) {
    localStorage.setItem('prism_unlocked_levels', id.toString());
  }
}

export function getLevelStars(id: number): number {
  const stars = localStorage.getItem(`prism_level_${id}_stars`);
  return stars ? parseInt(stars) : 0;
}

export function setLevelStars(id: number, stars: number): void {
  const current = getLevelStars(id);
  if (stars > current) {
    localStorage.setItem(`prism_level_${id}_stars`, stars.toString());
  }
}

export function calculateStars(score: number, targetScore: number): number {
  if (score >= targetScore * 2) return 3;
  if (score >= targetScore * 1.5) return 2;
  if (score >= targetScore) return 1;
  return 0;
}

export function getTotalStars(): number {
  let total = 0;
  const max = getUnlockedLevels();
  for (let i = 1; i < max; i++) total += getLevelStars(i);
  return total;
}
