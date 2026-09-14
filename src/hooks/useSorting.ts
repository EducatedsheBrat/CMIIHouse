'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { HouseId } from '../lib/constants';
import { countMembers, pickHouse, WHEEL_STOP_MS } from '../lib/sorting';
import type { AppUser } from '../lib/types';
import { firestoreErrorMessage } from './usePoints';

/** Imperative controls for the wheel + panther, registered by the ceremony page. */
export interface CeremonyStage {
  spin: () => void;
  /** Decelerates onto `houseId`; resolves once the wheel has landed. */
  stop: (houseId: HouseId) => Promise<void>;
  /** Returns the panther to its idle state for the next student. */
  reset: () => void;
}

export type CeremonyPhase = 'idle' | 'spinning' | 'stopping' | 'reveal';

export interface SortLogEntry {
  student: AppUser;
  houseId: HouseId;
  at: Date;
}

const AUTO_STOP_MIN_MS = 3000;
const AUTO_STOP_MAX_MS = 5000;
const REVEAL_PAUSE_MS = 500;
export const REVEAL_HOLD_MS = 3000;

// ---------- Firestore writes ----------

export async function sortStudent(studentId: string, houseId: HouseId) {
  await updateDoc(doc(db, 'users', studentId), { houseId, sorted: true, sortedAt: serverTimestamp() });
}

/** Puts a student back in the unsorted queue. Security rules allow this only for students with no points. */
export async function unsortStudent(studentId: string) {
  await updateDoc(doc(db, 'users', studentId), { houseId: null, sorted: false, sortedAt: null });
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Sorting ceremony state machine:
 * idle → (spin) spinning → (stop / auto-stop) stopping → (landed + saved) reveal → (3s / tap) idle.
 * The winning house is chosen with auto-balance *before* the wheel spins.
 */
export function useSorting(students: AppUser[], stageRef: RefObject<CeremonyStage | null>) {
  const unsorted = useMemo(() => students.filter((s) => !s.sorted), [students]);
  const counts = useMemo(() => countMembers(students.filter((s) => s.sorted)), [students]);

  const [phase, setPhaseState] = useState<CeremonyPhase>('idle');
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [result, setResult] = useState<{ student: AppUser; houseId: HouseId } | null>(null);
  const [log, setLog] = useState<SortLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const winnerRef = useRef<HouseId | null>(null);
  const timers = useRef<number[]>([]);
  // Mirrors `phase` for callbacks fired by timers and double-clicks, which would otherwise see a stale value.
  const phaseRef = useRef<CeremonyPhase>('idle');
  const setPhase = useCallback((next: CeremonyPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  // The chosen student while they're still unsorted, otherwise the next one in line.
  const activeId = unsorted.some((s) => s.id === chosenId) ? chosenId : (unsorted[0]?.id ?? null);
  const activeStudent = unsorted.find((s) => s.id === activeId) ?? null;
  const current = result && phase !== 'idle' ? result.student : activeStudent;

  const select = useCallback((studentId: string) => {
    if (phaseRef.current !== 'idle') return;
    setError(null);
    setChosenId(studentId);
  }, []);

  const finishReveal = useCallback(() => {
    if (phaseRef.current !== 'reveal') return;
    clearTimers();
    stageRef.current?.reset();
    setResult(null);
    setPhase('idle');
  }, [clearTimers, setPhase, stageRef]);

  const stop = useCallback(async () => {
    const student = activeStudent;
    const houseId = winnerRef.current;
    if (phaseRef.current !== 'spinning' || !houseId || !student) return;
    clearTimers();
    setPhase('stopping');
    setResult({ student, houseId });

    // Save while the wheel slows, so the reveal only happens once the sort is recorded.
    const [saved] = await Promise.allSettled([
      sortStudent(student.id, houseId),
      stageRef.current?.stop(houseId) ?? wait(WHEEL_STOP_MS),
    ]);
    if (saved.status === 'rejected') {
      setError(`Couldn’t record ${student.displayName}’s house: ${firestoreErrorMessage(saved.reason)} Spin again to retry.`);
      stageRef.current?.reset();
      setResult(null);
      setPhase('idle');
      return;
    }

    await wait(REVEAL_PAUSE_MS);
    setLog((l) => [{ student, houseId, at: new Date() }, ...l]);
    setPhase('reveal');
    timers.current.push(window.setTimeout(finishReveal, REVEAL_HOLD_MS + 900));
  }, [activeStudent, clearTimers, finishReveal, setPhase, stageRef]);

  const spin = useCallback(() => {
    if (phaseRef.current !== 'idle' || !activeStudent) return;
    setError(null);
    winnerRef.current = pickHouse(counts);
    setPhase('spinning');
    stageRef.current?.spin();
    // The student can't change mid-spin, so this render's `stop` stays valid for the auto-stop.
    const autoStop = AUTO_STOP_MIN_MS + Math.random() * (AUTO_STOP_MAX_MS - AUTO_STOP_MIN_MS);
    timers.current.push(window.setTimeout(() => void stop(), autoStop));
  }, [activeStudent, counts, setPhase, stageRef, stop]);

  const undoLast = useCallback(async () => {
    const last = log[0];
    if (!last || phaseRef.current !== 'idle') return;
    try {
      await unsortStudent(last.student.id);
      setLog((l) => l.slice(1));
      setChosenId(last.student.id);
    } catch (err) {
      setError(
        (err as { code?: string }).code === 'permission-denied'
          ? `${last.student.displayName} can’t be unsorted — they’ve already earned points, or the sort is over an hour old. An admin can reassign them from the roster.`
          : firestoreErrorMessage(err),
      );
    }
  }, [log]);

  return {
    phase,
    current,
    result,
    unsorted,
    counts,
    log,
    error,
    select,
    spin,
    stop,
    finishReveal,
    undoLast,
    clearError: () => setError(null),
  };
}
