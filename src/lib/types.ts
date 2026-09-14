import type { Timestamp } from 'firebase/firestore';
import type { CategoryKey, HouseId, Role } from './constants';

export type { CategoryKey, HouseId, Role } from './constants';

export interface HouseStanding {
  houseId: HouseId;
  totalPoints: number;
}

export interface Season {
  id: string; // "2026-2027"
  name: string; // "2026-2027 Academic Year"
  status: 'active' | 'closed';
  startDate: Timestamp;
  endDate: Timestamp;
  createdBy: string;
  /** Snapshot of the final standings, written when the season is closed. */
  finalStandings?: HouseStanding[];
  closedAt?: Timestamp;
}

export interface House {
  id: HouseId;
  name: string;
  motto: string;
  description: string;
  color: string;
  totalPoints: number; // denormalized — updated in the award transaction
  seasonId: string;
  advisors: string[]; // faculty user ids (lowercase emails)
  lastPointId?: string;
}

export interface RankedHouse extends House {
  rank: number; // 1-4, ties share a rank
}

export interface AppUser {
  id: string; // lowercase email — see firestore.rules for why
  uid?: string; // Firebase Auth uid, recorded on first sign-in
  email: string;
  displayName: string;
  role: Role;
  houseId: HouseId | null; // null = unsorted student, or faculty who advise no house
  sorted: boolean; // false until the sorting ceremony (or an admin) assigns a house
  sortedAt: Timestamp | null;
  seasonId: string;
  totalPoints: number; // denormalized
  createdAt: Timestamp;
  photoURL?: string;
  lastLoginAt?: Timestamp;
  lastPointId?: string;
}

export interface PointAward {
  id: string;
  studentId: string;
  studentName?: string;
  houseId: HouseId;
  seasonId: string;
  category: CategoryKey;
  amount: number;
  note: string;
  awardedBy: string;
  awardedByName?: string;
  awardedAt: Timestamp | null; // null while the server timestamp is pending
}
