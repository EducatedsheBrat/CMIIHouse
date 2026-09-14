'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CATEGORIES, isHouseId, NOTE_MAX_LENGTH, type CategoryKey, type HouseId } from '../lib/constants';
import type { AppUser, PointAward } from '../lib/types';

function toPoint(d: QueryDocumentSnapshot<DocumentData>): PointAward {
  // "estimate" gives pending server timestamps a local time instead of null.
  const data = d.data({ serverTimestamps: 'estimate' });
  return { id: d.id, ...data } as PointAward;
}

export function firestoreErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code === 'permission-denied') return 'Permission denied. Your role may not allow this, or the season is not active.';
  if (code === 'failed-precondition') return 'This query needs a Firestore index. Deploy firestore.indexes.json (npm run deploy:rules).';
  if (code === 'unavailable') return 'Can’t reach the server. Check your connection.';
  return (err as Error)?.message || 'Something went wrong.';
}

// ---------- Queries ----------

const NO_POINTS: PointAward[] = [];

/** A student's award history for a season, newest first (live). */
export function useStudentPoints(studentId: string | null | undefined, seasonId: string | null | undefined) {
  const enabled = !!studentId && !!seasonId;
  const key = `${studentId}|${seasonId}`;
  // Snapshots are tagged with the query they answer, so switching students never shows stale awards.
  const [state, setState] = useState<{ key: string; points: PointAward[]; error: string | null } | null>(null);

  useEffect(() => {
    if (!studentId || !seasonId) return;
    const q = query(
      collection(db, 'points'),
      where('studentId', '==', studentId),
      where('seasonId', '==', seasonId),
      orderBy('awardedAt', 'desc'),
    );
    const tag = `${studentId}|${seasonId}`;
    return onSnapshot(
      q,
      (snap) => setState({ key: tag, points: snap.docs.map(toPoint), error: null }),
      (err) => setState({ key: tag, points: NO_POINTS, error: firestoreErrorMessage(err) }),
    );
  }, [studentId, seasonId]);

  const current = enabled && state?.key === key ? state : null;
  return { points: current?.points ?? NO_POINTS, loading: enabled && !current, error: current?.error ?? null };
}

interface FeedOptions {
  seasonId: string | null | undefined;
  houseId?: HouseId | null;
  category?: CategoryKey | null;
  pageSize?: number;
}

/**
 * Season-wide award feed, newest first. The listener stays live, and "load more"
 * widens its limit (paging forward from the last loaded award) so new awards
 * slide in at the top without leaving gaps between pages.
 */
export function usePointFeed({ seasonId, houseId = null, category = null, pageSize = 20 }: FeedOptions) {
  const filterKey = `${seasonId}|${houseId}|${category}|${pageSize}`;

  // Paging belongs to one filter combination; changing a filter starts again at page 1.
  const [paging, setPaging] = useState({ key: filterKey, pages: 1 });
  const pages = paging.key === filterKey ? paging.pages : 1;
  const max = pages * pageSize;

  const [data, setData] = useState<{ key: string; max: number; items: PointAward[]; error: string | null } | null>(null);

  useEffect(() => {
    if (!seasonId) return;
    const constraints: QueryConstraint[] = [where('seasonId', '==', seasonId)];
    if (houseId) constraints.push(where('houseId', '==', houseId));
    if (category) constraints.push(where('category', '==', category));
    constraints.push(orderBy('awardedAt', 'desc'), limit(max));
    const key = `${seasonId}|${houseId}|${category}|${pageSize}`;

    return onSnapshot(
      query(collection(db, 'points'), ...constraints),
      (snap) => setData({ key, max, items: snap.docs.map(toPoint), error: null }),
      (err) => setData((prev) => ({ key, max, items: prev?.key === key ? prev.items : NO_POINTS, error: firestoreErrorMessage(err) })),
    );
  }, [seasonId, houseId, category, pageSize, max]);

  const loadMore = useCallback(() => {
    setPaging({ key: filterKey, pages: pages + 1 });
  }, [filterKey, pages]);

  // Keep showing the current filter's awards while a bigger page loads.
  const current = seasonId && data?.key === filterKey ? data : null;
  return {
    items: current?.items ?? NO_POINTS,
    loading: !!seasonId && !current,
    loadingMore: !!current && current.max < max,
    hasMore: !!current && current.items.length >= current.max,
    loadMore,
    error: current?.error ?? null,
  };
}

// ---------- Mutations ----------

export interface AwardInput {
  studentId: string;
  category: CategoryKey;
  amount: number;
  note: string;
  seasonId: string;
  awardedBy: AppUser;
}

export interface AwardResult {
  pointId: string;
  houseId: HouseId;
  studentTotal: number;
  houseTotal: number;
}

/**
 * Awards points atomically: creates the point document and increments both the
 * student's and the house's denormalized totals in a single transaction.
 */
export async function awardPoints(input: AwardInput): Promise<AwardResult> {
  const meta = CATEGORIES[input.category];
  if (!meta) throw new Error('Choose a category.');
  if (!Number.isInteger(input.amount) || input.amount < meta.min || input.amount > meta.max) {
    throw new Error(`${meta.label} awards must be between ${meta.min} and ${meta.max} points.`);
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('You’re offline. Points can only be awarded with a connection.');
  }

  const studentRef = doc(db, 'users', input.studentId);
  const pointRef = doc(collection(db, 'points'));

  try {
    return await runTransaction(db, async (tx) => {
      const studentSnap = await tx.get(studentRef);
      if (!studentSnap.exists()) throw new Error('That student no longer exists.');
      const student = studentSnap.data() as AppUser;
      if (student.role !== 'student' || !isHouseId(student.houseId)) {
        throw new Error('This person isn’t a sorted student.');
      }

      const houseRef = doc(db, 'houses', student.houseId);
      const houseSnap = await tx.get(houseRef);
      if (!houseSnap.exists()) throw new Error('House not found. Has the database been set up?');
      const house = houseSnap.data();
      if (house.seasonId !== input.seasonId) {
        throw new Error('This house isn’t enrolled in the active season yet. Ask an admin to activate the season.');
      }

      const studentTotal = (student.totalPoints ?? 0) + input.amount;
      const houseTotal = (house.totalPoints ?? 0) + input.amount;

      tx.set(pointRef, {
        studentId: input.studentId,
        studentName: student.displayName,
        houseId: student.houseId,
        seasonId: input.seasonId,
        category: input.category,
        amount: input.amount,
        note: input.note.trim().slice(0, NOTE_MAX_LENGTH),
        awardedBy: input.awardedBy.id,
        awardedByName: input.awardedBy.displayName,
        awardedAt: serverTimestamp(),
      });
      tx.update(studentRef, { totalPoints: studentTotal, lastPointId: pointRef.id });
      tx.update(houseRef, { totalPoints: houseTotal, lastPointId: pointRef.id });

      return { pointId: pointRef.id, houseId: student.houseId, studentTotal, houseTotal };
    });
  } catch (err) {
    if ((err as { code?: string }).code) throw new Error(firestoreErrorMessage(err));
    throw err;
  }
}

/** Admin: deletes an award and subtracts it from the student and house totals. */
export async function revokePoint(pointId: string): Promise<void> {
  const pointRef = doc(db, 'points', pointId);
  await runTransaction(db, async (tx) => {
    const pointSnap = await tx.get(pointRef);
    if (!pointSnap.exists()) return;
    const point = pointSnap.data() as PointAward;
    const studentRef = doc(db, 'users', point.studentId);
    const houseRef = doc(db, 'houses', point.houseId);
    const [studentSnap, houseSnap] = await Promise.all([tx.get(studentRef), tx.get(houseRef)]);

    tx.delete(pointRef);
    if (studentSnap.exists() && studentSnap.data().seasonId === point.seasonId) {
      tx.update(studentRef, { totalPoints: Math.max(0, (studentSnap.data().totalPoints ?? 0) - point.amount) });
    }
    if (houseSnap.exists() && houseSnap.data().seasonId === point.seasonId) {
      tx.update(houseRef, { totalPoints: Math.max(0, (houseSnap.data().totalPoints ?? 0) - point.amount) });
    }
  });
}
