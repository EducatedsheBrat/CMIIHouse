'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where, type DocumentData, type QueryConstraint } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isHouseId } from '../lib/constants';
import type { AppUser } from '../lib/types';

/** Firestore → AppUser, filling fields older documents may lack. */
export function toAppUser(id: string, data: DocumentData): AppUser {
  const houseId = isHouseId(data.houseId) ? data.houseId : null;
  return {
    ...data,
    id,
    houseId,
    // Documents created before the sorting ceremony existed count as sorted if they have a house.
    sorted: typeof data.sorted === 'boolean' ? data.sorted && !!houseId : !!houseId,
    sortedAt: data.sortedAt ?? null,
    totalPoints: data.totalPoints ?? 0,
  } as AppUser;
}

interface UsersState {
  users: AppUser[];
  loading: boolean;
  error: string | null;
}

const NO_USERS: AppUser[] = [];

/**
 * Live user list. `kind` picks the role filter; `seasonId` narrows students to one season.
 * Snapshots are tagged with the query they answer, so a changed filter reads as loading
 * instead of briefly showing the previous list.
 */
function useUserQuery(kind: 'students' | 'faculty', seasonId: string | undefined, enabled: boolean): UsersState {
  const key = `${kind}:${seasonId ?? '*'}`;
  const [state, setState] = useState<{ key: string; users: AppUser[]; error: string | null } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const constraints: QueryConstraint[] =
      kind === 'faculty' ? [where('role', 'in', ['faculty', 'admin'])] : [where('role', '==', 'student')];
    if (kind === 'students' && seasonId) constraints.push(where('seasonId', '==', seasonId));
    const tag = `${kind}:${seasonId ?? '*'}`;

    return onSnapshot(
      query(collection(db, 'users'), ...constraints),
      (snap) => {
        const list = snap.docs.map((d) => toAppUser(d.id, d.data()));
        list.sort((a, b) => a.displayName.localeCompare(b.displayName));
        setState({ key: tag, users: list, error: null });
      },
      (err) => setState({ key: tag, users: NO_USERS, error: err.message }),
    );
  }, [kind, seasonId, enabled]);

  const current = enabled && state?.key === key ? state : null;
  return { users: current?.users ?? NO_USERS, loading: enabled && !current, error: current?.error ?? null };
}

/**
 * Students enrolled in a season (live). Pass `undefined` to load every student, or `null`
 * to wait (e.g. while the active season is still loading).
 */
export function useStudents(seasonId?: string | null) {
  const state = useUserQuery('students', seasonId ?? undefined, seasonId !== null);
  const sorted = useMemo(() => state.users.filter((u) => u.sorted), [state.users]);
  const unsorted = useMemo(() => state.users.filter((u) => !u.sorted), [state.users]);
  return { ...state, sorted, unsorted };
}

/** Faculty and admins (live). */
export function useFaculty(): UsersState {
  return useUserQuery('faculty', undefined, true);
}
