// Sorting ceremony logic: auto-balanced house selection and wheel geometry.
// Pure functions only, so they're unit-tested in tests/unit/sorting.test.ts.

import { HOUSE_IDS, WHEEL_SECTIONS, type HouseId } from './constants';

export type HouseCounts = Record<HouseId, number>;

export function emptyCounts(): HouseCounts {
  return { lumina: 0, doron: 0, ase: 0, kaizen: 0 };
}

/** Members per house among sorted students. */
export function countMembers(students: Array<{ houseId: string | null; sorted?: boolean }>): HouseCounts {
  const counts = emptyCounts();
  for (const s of students) {
    if (s.houseId && (HOUSE_IDS as readonly string[]).includes(s.houseId)) counts[s.houseId as HouseId]++;
  }
  return counts;
}

/**
 * Weights for the next sort. Houses at the minimum size get 3×, houses one behind get 1×,
 * and houses two or more ahead are skipped. The audience sees a random-looking wheel, but
 * the gap between the largest and smallest house never grows past 2.
 */
export function balanceWeights(counts: HouseCounts): HouseCounts {
  const min = Math.min(...HOUSE_IDS.map((id) => counts[id]));
  const weights = emptyCounts();
  for (const id of HOUSE_IDS) {
    const lead = counts[id] - min;
    weights[id] = lead === 0 ? 3 : lead === 1 ? 1 : 0;
  }
  return weights;
}

/** Picks the house for the next student before the wheel spins. */
export function pickHouse(counts: HouseCounts, rng: () => number = Math.random): HouseId {
  const weights = balanceWeights(counts);
  const total = HOUSE_IDS.reduce((sum, id) => sum + weights[id], 0);
  let roll = rng() * total;
  for (const id of HOUSE_IDS) {
    roll -= weights[id];
    if (roll < 0) return id;
  }
  return HOUSE_IDS.find((id) => weights[id] > 0) ?? 'lumina';
}

/** Normalizes any angle into [0, 360). */
export function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** The house under the fixed 12 o'clock pointer when the wheel is rotated clockwise by `rotation` degrees. */
export function sectionAtPointer(rotation: number): HouseId {
  const wheelAngle = normalizeDeg(-rotation);
  return (WHEEL_SECTIONS.find((s) => wheelAngle >= s.start && wheelAngle < s.end) ?? WHEEL_SECTIONS[0]).houseId;
}

/**
 * The absolute rotation that lands `houseId` under the pointer, continuing clockwise from
 * `current` with 3–5 extra full turns. The landing point is jittered inside the section
 * (never within 12° of a divider) so results don't look staged.
 */
export function targetRotation(current: number, houseId: HouseId, rng: () => number = Math.random): number {
  const section = WHEEL_SECTIONS.find((s) => s.houseId === houseId)!;
  const margin = 12;
  const landAt = section.start + margin + rng() * (section.end - section.start - margin * 2);
  const delta = normalizeDeg(-landAt - current);
  const extraTurns = 3 + Math.floor(rng() * 3); // 3, 4 or 5
  return current + delta + extraTurns * 360;
}

/**
 * Slope of a CSS cubic-bezier timing curve at progress t, relative to its slope at t = 0.
 * Used to slow the panther's run cycle in step with the wheel's deceleration.
 */
export function bezierVelocityRatio(t: number, x1: number, y1: number, x2: number, y2: number): number {
  const bx = (u: number) => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  const dx = (u: number) => 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
  const dy = (u: number) => 3 * (1 - u) * (1 - u) * y1 + 6 * (1 - u) * u * (y2 - y1) + 3 * u * u * (1 - y2);
  if (t <= 0) return 1;
  if (t >= 1) return 0;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (bx(mid) < t) lo = mid;
    else hi = mid;
  }
  const u = (lo + hi) / 2;
  const initial = y1 / x1;
  return Math.max(0, dy(u) / dx(u) / initial);
}

/** The wheel's deceleration curve and duration (from the ceremony spec). */
export const WHEEL_STOP_MS = 2500;
export const WHEEL_STOP_EASING = [0.15, 0.85, 0.35, 1] as const;
