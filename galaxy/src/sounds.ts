// Procedural sound effects + haptics via Web Audio API. No audio assets needed.
import { loadSettings } from './storage';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioContext) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      audioContext = new Ctor();
    }
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  } catch { return null; }
}

function enabled(): boolean {
  return loadSettings().sound;
}

function tone(freq: number, dur: number, vol: number, type: OscillatorType = 'sine', delay = 0, glideTo?: number) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function vibrate(pattern: number | number[]) {
  try {
    if (!loadSettings().haptics) return;
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {}
}

export function playPlaceSound() {
  if (!enabled()) return;
  tone(340, 0.09, 0.08, 'triangle', 0, 520);
  vibrate(8);
}

export function playSelectSound() {
  if (!enabled()) return;
  tone(700, 0.06, 0.04, 'sine');
}

export function playClearSound(combo: number = 0) {
  if (!enabled()) return;
  const base = 480 + Math.min(combo, 6) * 60;
  tone(base, 0.22, 0.09, 'sine', 0, base * 1.5);
  tone(base * 1.5, 0.22, 0.05, 'sine', 0.05, base * 2);
  vibrate([12, 20, 18]);
}

export function playComboSound(combo: number) {
  if (!enabled()) return;
  const notes = [523, 659, 784, 1047, 1319];
  for (let i = 0; i < Math.min(combo, 5); i++) {
    tone(notes[i], 0.18, 0.06, 'sine', i * 0.07);
  }
}

export function playLevelWin() {
  if (!enabled()) return;
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 0.07, 'triangle', i * 0.12));
  vibrate([20, 40, 20, 40, 40]);
}

export function playGameOverSound() {
  if (!enabled()) return;
  tone(360, 0.5, 0.08, 'sine', 0, 130);
  vibrate([30, 50, 60]);
}

export function playAchievement() {
  if (!enabled()) return;
  tone(880, 0.15, 0.06, 'sine');
  tone(1174, 0.25, 0.06, 'sine', 0.12);
}
