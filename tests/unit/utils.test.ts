import { describe, expect, it } from 'vitest';
import { matchHouse, rankHouses, seasonLabel } from '../../src/lib/utils';
import type { House } from '../../src/lib/types';

describe('matchHouse (CSV house column)', () => {
  it('matches names regardless of accents, case, and spacing', () => {
    expect(matchHouse('Asé')).toBe('ase');
    expect(matchHouse('ASE')).toBe('ase');
    expect(matchHouse(' kaizen ')).toBe('kaizen');
    expect(matchHouse('Lumina')).toBe('lumina');
    expect(matchHouse('Hufflepuff')).toBeNull();
  });
});

describe('seasonLabel', () => {
  it('pairs a journey name with its academic year', () => {
    expect(seasonLabel({ id: '2026-2027', name: 'LeaderQuest' })).toBe('LeaderQuest · 2026–2027');
  });
  it('does not repeat a year the name already contains', () => {
    expect(seasonLabel({ id: '2026-2027', name: '2026-2027 Academic Year' })).toBe('2026-2027 Academic Year');
  });
  it('falls back to the year when the name is empty', () => {
    expect(seasonLabel({ id: '2027-2028', name: '' })).toBe('2027–2028 Season');
  });
});

describe('rankHouses', () => {
  it('ranks by points and lets ties share a rank', () => {
    const h = (id: House['id'], totalPoints: number) => ({ id, name: id, totalPoints }) as House;
    const ranked = rankHouses([h('lumina', 100), h('doron', 300), h('ase', 300), h('kaizen', 50)]);
    expect(ranked.map((r) => [r.id, r.rank])).toEqual([
      ['ase', 1],
      ['doron', 1],
      ['lumina', 3],
      ['kaizen', 4],
    ]);
  });
});
