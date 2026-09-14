import type { Timestamp } from 'firebase/firestore';
import { HOUSES, isHouseId, type HouseId } from './constants';
import type { House, RankedHouse } from './types';

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

const numberFormat = new Intl.NumberFormat('en-US');
export function formatPoints(n: number): string {
  return numberFormat.format(Math.round(n));
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
export function roman(n: number): string {
  return ROMAN[n] ?? String(n);
}

// ---------- Color helpers ----------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Mixes color a toward color b by t (0 = a, 1 = b). */
export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const out = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function lighten(hex: string, t: number): string {
  return mix(hex, '#ffffff', t);
}

export function darken(hex: string, t: number): string {
  return mix(hex, '#0A1628', t);
}

export function houseColor(houseId: string | null | undefined): string {
  return isHouseId(houseId) ? HOUSES[houseId].color : '#D4A843';
}

// ---------- Houses ----------

export function rankHouses(houses: House[]): RankedHouse[] {
  const sorted = [...houses].sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
  let lastPoints = Number.NaN;
  let lastRank = 0;
  return sorted.map((h, i) => {
    const rank = h.totalPoints === lastPoints ? lastRank : i + 1;
    lastPoints = h.totalPoints;
    lastRank = rank;
    return { ...h, rank };
  });
}

/** Matches "Ase", "asé", " KAIZEN " etc. to a house id. */
export function matchHouse(input: string): HouseId | null {
  const normalized = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
  if (isHouseId(normalized)) return normalized;
  const byName = Object.values(HOUSES).find(
    (h) => h.name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() === normalized,
  );
  return byName?.id ?? null;
}

// ---------- Time ----------

export function toDate(ts: Timestamp | Date | null | undefined): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  return ts.toDate();
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
export function timeAgo(ts: Timestamp | Date | null | undefined): string {
  const date = toDate(ts);
  if (!date) return 'just now';
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  if (abs < 86400 * 7) return rtf.format(Math.round(seconds / 86400), 'day');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

export function formatDateTime(ts: Timestamp | Date | null | undefined): string {
  const date = toDate(ts);
  if (!date) return 'Pending…';
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatDate(ts: Timestamp | Date | null | undefined): string {
  const date = toDate(ts);
  if (!date) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function dayLabel(date: Date): string {
  const today = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(date)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isGsuEmail(email: string): boolean {
  return /^[^@\s]+@([a-z0-9-]+\.)*gsu\.edu$/i.test(email.trim());
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function downloadCsv(filename: string, rows: Array<Array<string | number>>): void {
  const csv = rows
    .map((row) => row.map((cell) => {
      const s = String(cell ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
