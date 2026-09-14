// Security rules tests — run with `npm run test:rules` (starts the Firestore emulator).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

const SEASON = '2026-2027';
const ADMIN = 'admin@gsu.edu';
const FACULTY = 'prof@gsu.edu';
const STUDENT = 'student@student.gsu.edu';
const OTHER_STUDENT = 'other@student.gsu.edu';
const NEW_STUDENT = 'new.arrival@student.gsu.edu';

let env: RulesTestEnvironment;

function as(email: string, opts: { verified?: boolean } = {}): Firestore {
  return env
    .authenticatedContext(`uid-${email}`, { email, email_verified: opts.verified ?? true })
    .firestore() as unknown as Firestore;
}

function anon(): Firestore {
  return env.unauthenticatedContext().firestore() as unknown as Firestore;
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-leaderquest-rules',
    firestore: { rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8') },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const user = (email: string, role: string, houseId: string | null) =>
      setDoc(doc(db, 'users', email), { email, displayName: email, role, houseId, seasonId: SEASON, totalPoints: 0 });
    await setDoc(doc(db, 'seasons', SEASON), { name: '2026-2027 Academic Year', status: 'active' });
    await setDoc(doc(db, 'seasons', '2025-2026'), { name: 'Old', status: 'closed' });
    await setDoc(doc(db, 'houses', 'lumina'), { name: 'Lumina', totalPoints: 100, seasonId: SEASON, advisors: [] });
    await setDoc(doc(db, 'houses', 'doron'), { name: 'Doron', totalPoints: 0, seasonId: SEASON, advisors: [] });
    await user(ADMIN, 'admin', null);
    await user(FACULTY, 'faculty', 'lumina');
    await user(STUDENT, 'student', 'lumina');
    await user(OTHER_STUDENT, 'student', 'doron');
    await setDoc(doc(db, 'users', NEW_STUDENT), {
      email: NEW_STUDENT, displayName: 'New Arrival', role: 'student', houseId: null, sorted: false, sortedAt: null, seasonId: SEASON, totalPoints: 0,
    });
  });
});

/** The same transaction the app runs in usePoints.awardPoints. */
function award(
  db: Firestore,
  opts: { studentId?: string; houseId?: string; amount?: number; category?: string; bump?: number; bumpHouse?: number; skipHouse?: boolean; seasonId?: string; awardedBy?: string; id?: string } = {},
) {
  const studentId = opts.studentId ?? STUDENT;
  const houseId = opts.houseId ?? 'lumina';
  const amount = opts.amount ?? 75;
  const pointRef = doc(db, 'points', opts.id ?? `p-${Math.random().toString(36).slice(2)}`);
  return runTransaction(db, async (tx) => {
    const s = await tx.get(doc(db, 'users', studentId));
    const h = await tx.get(doc(db, 'houses', houseId));
    tx.set(pointRef, {
      studentId,
      studentName: 'Student',
      houseId,
      seasonId: opts.seasonId ?? SEASON,
      category: opts.category ?? 'academic',
      amount,
      note: 'Great work',
      awardedBy: opts.awardedBy ?? FACULTY,
      awardedByName: 'Prof',
      awardedAt: serverTimestamp(),
    });
    tx.update(doc(db, 'users', studentId), { totalPoints: (s.data()?.totalPoints ?? 0) + (opts.bump ?? amount), lastPointId: pointRef.id });
    if (!opts.skipHouse) {
      tx.update(doc(db, 'houses', houseId), { totalPoints: (h.data()?.totalPoints ?? 0) + (opts.bumpHouse ?? amount), lastPointId: pointRef.id });
    }
  });
}

describe('public access', () => {
  it('anyone can read houses and seasons (kiosk)', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'houses', 'lumina')));
    await assertSucceeds(getDoc(doc(anon(), 'seasons', SEASON)));
  });

  it('anonymous visitors cannot read users or points', async () => {
    await assertFails(getDoc(doc(anon(), 'users', STUDENT)));
    await assertFails(getDoc(doc(anon(), 'points', 'x')));
  });

  it('nobody but admins can write houses directly', async () => {
    await assertFails(updateDoc(doc(as(FACULTY), 'houses', 'lumina'), { totalPoints: 9999 }));
    await assertFails(updateDoc(doc(as(STUDENT), 'houses', 'lumina'), { name: 'Hacked' }));
    await assertSucceeds(updateDoc(doc(as(ADMIN), 'houses', 'lumina'), { motto: 'Vision & Light' }));
  });
});

describe('domain restriction', () => {
  it('members with verified GSU emails can read the roster', async () => {
    await assertSucceeds(getDoc(doc(as(STUDENT), 'users', OTHER_STUDENT)));
  });

  it('a non-GSU account cannot read the roster, even with a provisioned-looking doc', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'users', 'someone@gmail.com'), { role: 'admin', email: 'someone@gmail.com' }));
    await assertFails(getDoc(doc(as('someone@gmail.com'), 'users', STUDENT)));
    await assertFails(setDoc(doc(as('someone@gmail.com'), 'seasons', 'x'), { status: 'active' }));
  });

  it('an unverified email cannot impersonate an admin', async () => {
    await assertFails(getDoc(doc(as(ADMIN, { verified: false }), 'users', STUDENT)));
    await assertFails(setDoc(doc(as(ADMIN, { verified: false }), 'seasons', 'x'), { status: 'active' }));
  });

  it('someone not on the rolls can check for their own doc but not read others', async () => {
    await assertSucceeds(getDoc(doc(as('newbie@gsu.edu'), 'users', 'newbie@gsu.edu')));
    await assertFails(getDoc(doc(as('newbie@gsu.edu'), 'users', STUDENT)));
  });
});

describe('users', () => {
  it('students cannot change their own role or points', async () => {
    await assertFails(updateDoc(doc(as(STUDENT), 'users', STUDENT), { role: 'admin' }));
    await assertFails(updateDoc(doc(as(STUDENT), 'users', STUDENT), { totalPoints: 5000 }));
    await assertFails(updateDoc(doc(as(STUDENT), 'users', STUDENT), { houseId: 'doron' }));
  });

  it('members can record their uid and last login', async () => {
    await assertSucceeds(updateDoc(doc(as(STUDENT), 'users', STUDENT), { uid: `uid-${STUDENT}`, lastLoginAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as(STUDENT), 'users', STUDENT), { uid: 'someone-else' }));
  });

  it('only admins can create and delete users, keyed by email', async () => {
    const data = { email: 'new@student.gsu.edu', displayName: 'New', role: 'student', houseId: 'kaizen', seasonId: SEASON, totalPoints: 0 };
    await assertFails(setDoc(doc(as(FACULTY), 'users', 'new@student.gsu.edu'), data));
    await assertFails(setDoc(doc(as(ADMIN), 'users', 'mismatch@student.gsu.edu'), data));
    await assertSucceeds(setDoc(doc(as(ADMIN), 'users', 'new@student.gsu.edu'), data));
    await assertFails(deleteDoc(doc(as(FACULTY), 'users', 'new@student.gsu.edu')));
    await assertSucceeds(deleteDoc(doc(as(ADMIN), 'users', 'new@student.gsu.edu')));
  });
});

describe('sorting ceremony', () => {
  const sort = (db: Firestore, id = NEW_STUDENT, houseId: string | null = 'kaizen') =>
    updateDoc(doc(db, 'users', id), { houseId, sorted: true, sortedAt: serverTimestamp() });
  const unsort = (db: Firestore, id = NEW_STUDENT) => updateDoc(doc(db, 'users', id), { houseId: null, sorted: false, sortedAt: null });

  it('faculty can sort an unsorted student into a house', async () => {
    await assertSucceeds(sort(as(FACULTY)));
  });

  it('students cannot sort themselves or others', async () => {
    await assertFails(sort(as(NEW_STUDENT)));
    await assertFails(sort(as(STUDENT)));
  });

  it('faculty cannot re-sort a student who already has a house', async () => {
    await assertFails(sort(as(FACULTY), STUDENT, 'doron'));
  });

  it('rejects invalid houses and extra fields', async () => {
    await assertFails(sort(as(FACULTY), NEW_STUDENT, 'slytherin'));
    await assertFails(updateDoc(doc(as(FACULTY), 'users', NEW_STUDENT), { houseId: 'ase', sorted: true, sortedAt: serverTimestamp(), totalPoints: 500 }));
    await assertFails(updateDoc(doc(as(FACULTY), 'users', NEW_STUDENT), { houseId: 'ase', sorted: true, sortedAt: new Date(2020, 0, 1) }));
  });

  it('faculty can undo a fresh sort', async () => {
    await assertSucceeds(sort(as(FACULTY)));
    await assertSucceeds(unsort(as(FACULTY)));
  });

  it('cannot undo a sort once the student has points', async () => {
    await assertSucceeds(sort(as(FACULTY)));
    await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), 'users', NEW_STUDENT), { totalPoints: 50 }));
    await assertFails(unsort(as(FACULTY)));
  });

  it('cannot undo an old sort', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      updateDoc(doc(ctx.firestore(), 'users', NEW_STUDENT), { houseId: 'ase', sorted: true, sortedAt: new Date(Date.now() - 2 * 3600 * 1000) }),
    );
    await assertFails(unsort(as(FACULTY)));
  });

  it('admins can reassign any student directly', async () => {
    await assertSucceeds(updateDoc(doc(as(ADMIN), 'users', STUDENT), { houseId: 'doron', sorted: true, sortedAt: serverTimestamp() }));
  });

  it('points cannot be awarded to an unsorted student', async () => {
    await assertFails(award(as(FACULTY), { studentId: NEW_STUDENT, houseId: 'lumina' }));
  });
});

describe('awarding points', () => {
  it('faculty can award points in a transaction that bumps both totals', async () => {
    await assertSucceeds(award(as(FACULTY)));
  });

  it('students cannot award points', async () => {
    await assertFails(award(as(STUDENT), { studentId: OTHER_STUDENT, houseId: 'doron', awardedBy: STUDENT }));
  });

  it('rejects amounts outside the category range', async () => {
    await assertFails(award(as(FACULTY), { amount: 101 }));
    await assertFails(award(as(FACULTY), { amount: 45 }));
    await assertFails(award(as(FACULTY), { category: 'participation', amount: 11 }));
    await assertFails(award(as(FACULTY), { category: 'bribery', amount: 50 }));
    await assertSucceeds(award(as(FACULTY), { category: 'challenge', amount: 500 }));
  });

  it('rejects an award whose house total is not bumped', async () => {
    await assertFails(award(as(FACULTY), { skipHouse: true }));
  });

  it('rejects totals bumped by a different amount than the award', async () => {
    await assertFails(award(as(FACULTY), { bump: 500 }));
    await assertFails(award(as(FACULTY), { bumpHouse: 500 }));
  });

  it('rejects awards credited to the wrong house', async () => {
    await assertFails(award(as(FACULTY), { studentId: STUDENT, houseId: 'doron' }));
  });

  it('rejects awards attributed to someone else', async () => {
    await assertFails(award(as(FACULTY), { awardedBy: ADMIN }));
  });

  it('rejects awards in a closed season', async () => {
    await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), 'houses', 'lumina'), { seasonId: '2025-2026' }));
    await assertFails(award(as(FACULTY), { seasonId: '2025-2026' }));
  });

  it('faculty cannot bump totals without a new award, or reuse an old one', async () => {
    const db = as(FACULTY);
    await assertSucceeds(award(db, { id: 'first' }));
    await assertFails(updateDoc(doc(db, 'houses', 'lumina'), { totalPoints: 10000, lastPointId: 'first' }));
    await assertFails(updateDoc(doc(db, 'users', STUDENT), { totalPoints: 10000, lastPointId: 'first' }));
  });

  it('faculty cannot edit or delete awards; admins can', async () => {
    await assertSucceeds(award(as(FACULTY), { id: 'keep' }));
    await assertFails(updateDoc(doc(as(FACULTY), 'points', 'keep'), { amount: 100 }));
    await assertFails(deleteDoc(doc(as(FACULTY), 'points', 'keep')));
    await assertSucceeds(deleteDoc(doc(as(ADMIN), 'points', 'keep')));
  });

  it('admins can write award batches directly (seeding, corrections)', async () => {
    const db = as(ADMIN);
    const batch = writeBatch(db);
    batch.set(doc(db, 'points', 'seed-1'), { studentId: STUDENT, houseId: 'lumina', seasonId: SEASON, category: 'service', amount: 30, note: '', awardedBy: ADMIN });
    batch.update(doc(db, 'houses', 'lumina'), { totalPoints: 130 });
    await assertSucceeds(batch.commit());
  });
});
