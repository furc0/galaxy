import { Theme } from './types';

export const themes: Theme[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    bg: '#0a0e1a',
    bgGradient: 'linear-gradient(135deg, #0a0e1a 0%, #1a1a3e 50%, #0d1b2a 100%)',
    gridBg: 'rgba(255,255,255,0.03)',
    cellEmpty: 'rgba(255,255,255,0.04)',
    cellBorder: 'rgba(255,255,255,0.08)',
    textPrimary: '#e8e8ff',
    textSecondary: 'rgba(255,255,255,0.5)',
    accent: '#7c6ef0',
    colors: ['#7c6ef0', '#4ecdc4', '#ff6b9d', '#ffd93d', '#6c5ce7', '#a8e6cf'],
    particleColors: ['#7c6ef0', '#4ecdc4', '#ff6b9d', '#ffd93d'],
    glowColor: 'rgba(124,110,240,0.3)',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    bg: '#1a0a1e',
    bgGradient: 'linear-gradient(135deg, #1a0a1e 0%, #2d1b3d 50%, #1a0a2e 100%)',
    gridBg: 'rgba(255,255,255,0.03)',
    cellEmpty: 'rgba(255,255,255,0.04)',
    cellBorder: 'rgba(255,255,255,0.08)',
    textPrimary: '#ffe8f0',
    textSecondary: 'rgba(255,200,220,0.5)',
    accent: '#ff6b9d',
    colors: ['#ff6b9d', '#ffd93d', '#ff8a5c', '#ea5455', '#f78fb3', '#f8a5c2'],
    particleColors: ['#ff6b9d', '#ffd93d', '#ff8a5c', '#ea5455'],
    glowColor: 'rgba(255,107,157,0.3)',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    bg: '#0a1628',
    bgGradient: 'linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1a2e 100%)',
    gridBg: 'rgba(255,255,255,0.03)',
    cellEmpty: 'rgba(255,255,255,0.04)',
    cellBorder: 'rgba(255,255,255,0.08)',
    textPrimary: '#e0f4ff',
    textSecondary: 'rgba(150,220,255,0.5)',
    accent: '#4ecdc4',
    colors: ['#4ecdc4', '#45b7d1', '#96e6a1', '#74b9ff', '#a8e6cf', '#55efc4'],
    particleColors: ['#4ecdc4', '#45b7d1', '#74b9ff', '#55efc4'],
    glowColor: 'rgba(78,205,196,0.3)',
  },
  {
    id: 'forest',
    name: 'Forest',
    bg: '#0a1a0e',
    bgGradient: 'linear-gradient(135deg, #0a1a0e 0%, #1a2e1a 50%, #0d1f0d 100%)',
    gridBg: 'rgba(255,255,255,0.03)',
    cellEmpty: 'rgba(255,255,255,0.04)',
    cellBorder: 'rgba(255,255,255,0.08)',
    textPrimary: '#e8ffe8',
    textSecondary: 'rgba(150,255,150,0.5)',
    accent: '#55efc4',
    colors: ['#55efc4', '#00b894', '#a8e6cf', '#96e6a1', '#7bed9f', '#2ed573'],
    particleColors: ['#55efc4', '#00b894', '#96e6a1', '#7bed9f'],
    glowColor: 'rgba(85,239,196,0.3)',
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    bg: '#0d0a1a',
    bgGradient: 'linear-gradient(135deg, #0d0a1a 0%, #1a0d2e 50%, #0a0d1a 100%)',
    gridBg: 'rgba(255,255,255,0.03)',
    cellEmpty: 'rgba(255,255,255,0.04)',
    cellBorder: 'rgba(255,255,255,0.08)',
    textPrimary: '#f0e8ff',
    textSecondary: 'rgba(200,170,255,0.5)',
    accent: '#a855f7',
    colors: ['#a855f7', '#ec4899', '#6366f1', '#8b5cf6', '#d946ef', '#f472b6'],
    particleColors: ['#a855f7', '#ec4899', '#6366f1', '#d946ef'],
    glowColor: 'rgba(168,85,247,0.3)',
  },
];

export function getThemeByIndex(index: number): Theme {
  return themes[index % themes.length];
}

export function getThemeForScore(score: number): Theme {
  const threshold = 500;
  const index = Math.floor(score / threshold);
  return themes[index % themes.length];
}
