import { describe, expect, it } from 'vitest';
import { HOUSE_IDS } from '../../src/lib/constants';
import {
  balanceWeights,
  bezierVelocityRatio,
  countMembers,
  emptyCounts,
  normalizeDeg,
  pickHouse,
  sectionAtPointer,
  targetRotation,
} from '../../src/lib/sorting';

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe('auto-balance', () => {
  it('weights evenly when houses are equal', () => {
    expect(balanceWeights({ lumina: 5, doron: 5, ase: 5, kaizen: 5 })).toEqual({ lumina: 3, doron: 3, ase: 3, kaizen: 3 });
  });

  it('favors the smallest house and skips houses two ahead', () => {
    expect(balanceWeights({ lumina: 4, doron: 5, ase: 6, kaizen: 4 })).toEqual({ lumina: 3, doron: 1, ase: 0, kaizen: 3 });
  });

  it('never lets the house gap exceed 2 across a large cohort', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rng = seeded(seed);
      const counts = emptyCounts();
      for (let i = 0; i < 500; i++) {
        counts[pickHouse(counts, rng)]++;
        const values = HOUSE_IDS.map((id) => counts[id]);
        expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(2);
      }
    }
  });

  it('still looks random: every house wins at some point', () => {
    const rng = seeded(7);
    const counts = emptyCounts();
    const firsts = new Set<string>();
    for (let round = 0; round < 40; round++) {
      firsts.add(pickHouse({ lumina: 0, doron: 0, ase: 0, kaizen: 0 }, rng));
      counts[pickHouse(counts, rng)]++;
    }
    expect(firsts.size).toBe(4);
  });

  it('counts only sorted house members', () => {
    expect(countMembers([{ houseId: 'ase' }, { houseId: 'ase' }, { houseId: null }, { houseId: 'kaizen' }])).toEqual({ lumina: 0, doron: 0, ase: 2, kaizen: 1 });
  });
});

describe('wheel geometry', () => {
  it('reads the section under the pointer', () => {
    expect(sectionAtPointer(0)).toBe('lumina');
    expect(sectionAtPointer(-45)).toBe('lumina'); // wheel angle 45
    expect(sectionAtPointer(360 - 135)).toBe('doron');
    expect(sectionAtPointer(360 - 200)).toBe('ase');
    expect(sectionAtPointer(360 - 300)).toBe('kaizen');
  });

  it('always lands the chosen house under the pointer with 3–5 extra turns', () => {
    const rng = seeded(42);
    for (let i = 0; i < 400; i++) {
      const current = rng() * 5000;
      const house = HOUSE_IDS[i % 4];
      const target = targetRotation(current, house, rng);
      expect(sectionAtPointer(target)).toBe(house);
      const turns = (target - current) / 360;
      expect(turns).toBeGreaterThanOrEqual(3);
      expect(turns).toBeLessThan(6);
      // Never lands within 12° of a divider.
      const angle = normalizeDeg(-target) % 90;
      expect(angle).toBeGreaterThanOrEqual(11.99);
      expect(angle).toBeLessThanOrEqual(78.01);
    }
  });
});

describe('deceleration curve', () => {
  it('starts at full speed and eases to a stop', () => {
    expect(bezierVelocityRatio(0, 0.15, 0.85, 0.35, 1)).toBe(1);
    const mid = bezierVelocityRatio(0.5, 0.15, 0.85, 0.35, 1);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(0.2);
    expect(bezierVelocityRatio(1, 0.15, 0.85, 0.35, 1)).toBe(0);
  });
});
