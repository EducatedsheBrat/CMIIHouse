// Shared by the web app and the Node seed script — keep this file free of
// browser, Next.js, or Firebase imports.

export const HOUSE_IDS = ['lumina', 'doron', 'ase', 'kaizen'] as const;
export type HouseId = (typeof HOUSE_IDS)[number];

export type HouseIconKind = 'sun' | 'diamond' | 'star' | 'triangle';

export interface HouseMeta {
  id: HouseId;
  name: string;
  motto: string;
  description: string;
  color: string;
  icon: HouseIconKind;
  /** The house panther's signature pose. */
  pantherPose: string;
}

export const HOUSES: Record<HouseId, HouseMeta> = {
  lumina: {
    id: 'lumina',
    name: 'Lumina',
    motto: 'Vision & Light',
    description: 'From the Latin for light. Lumina sees what others miss and lights the path for everyone who follows.',
    color: '#D4A843',
    icon: 'sun',
    pantherPose: 'Head raised, looking ahead',
  },
  doron: {
    id: 'doron',
    name: 'Doron',
    motto: 'Gifts & Talents',
    description: 'From the Greek for gift. Doron believes every member carries a talent worth sharing with the world.',
    color: '#5B8DBE',
    icon: 'diamond',
    pantherPose: 'One paw extended in offering',
  },
  ase: {
    id: 'ase',
    name: 'Asé',
    motto: 'Creative Power',
    description: 'From the Yoruba àṣẹ, the power to make things happen. Asé turns imagination into work that moves people.',
    color: '#9B6BA3',
    icon: 'star',
    pantherPose: 'Roaring mid-leap',
  },
  kaizen: {
    id: 'kaizen',
    name: 'Kaizen',
    motto: 'Continuous Improvement',
    description: 'From the Japanese for change for the better. Kaizen grows a little every day and never stops leveling up.',
    color: '#6AAB6E',
    icon: 'triangle',
    pantherPose: 'In stride, running forward',
  },
};

/**
 * The sorting wheel, clockwise from the pointer at 12 o'clock.
 * Degrees match CSS conic-gradient angles.
 */
export const WHEEL_SECTIONS: ReadonlyArray<{ houseId: HouseId; start: number; end: number }> = [
  { houseId: 'lumina', start: 0, end: 90 },
  { houseId: 'doron', start: 90, end: 180 },
  { houseId: 'ase', start: 180, end: 270 },
  { houseId: 'kaizen', start: 270, end: 360 },
];

export const CATEGORY_KEYS = ['academic', 'participation', 'service', 'challenge', 'character'] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  shortLabel: string;
  min: number;
  max: number;
  step: number;
  color: string;
}

export const CATEGORIES: Record<CategoryKey, CategoryMeta> = {
  academic: { key: 'academic', label: 'Academic Excellence', shortLabel: 'Academic', min: 50, max: 100, step: 5, color: '#3FB8AF' },
  participation: { key: 'participation', label: 'Event Participation', shortLabel: 'Participation', min: 5, max: 10, step: 1, color: '#F08A4B' },
  service: { key: 'service', label: 'Community Service', shortLabel: 'Service', min: 20, max: 50, step: 5, color: '#E86A92' },
  challenge: { key: 'challenge', label: 'House Challenge', shortLabel: 'Challenge', min: 100, max: 500, step: 25, color: '#E04848' },
  character: { key: 'character', label: 'Character & Leadership', shortLabel: 'Character', min: 25, max: 50, step: 5, color: '#C3CAD9' },
};

export const ROLES = ['student', 'faculty', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const NOTE_MAX_LENGTH = 280;

export const COLORS = {
  royal: '#0F1B2D',
  night: '#0F1B2D',
  panel: '#1A2940',
  parchment: '#F5E6C8',
  gold: '#D4A843',
  goldLight: '#EBCB7A',
} as const;

export function isHouseId(value: unknown): value is HouseId {
  return typeof value === 'string' && (HOUSE_IDS as readonly string[]).includes(value);
}

export function isCategoryKey(value: unknown): value is CategoryKey {
  return typeof value === 'string' && (CATEGORY_KEYS as readonly string[]).includes(value);
}

/** Normalizes an email into the users/{id} document key. */
export function userKey(email: string): string {
  return email.trim().toLowerCase();
}
