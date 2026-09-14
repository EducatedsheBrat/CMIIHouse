// Admin-only write operations. Firestore security rules enforce the admin role;
// these helpers keep the multi-document updates consistent.

import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  type WriteBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { HOUSES, HOUSE_IDS, userKey, type HouseId, type Role } from './constants';
import type { AppUser, HouseStanding, Season } from './types';
import {
  SEED_ADMIN,
  SEED_FACULTY,
  SEED_POINTS,
  SEED_STUDENTS,
  SEED_UNSORTED,
  seedHouses,
  seedPointDate,
  seedSeason,
  tallyPoints,
} from './seedData';

/** Runs writes in batches under Firestore's 500-operation limit. */
async function chunkedWrites<T>(items: T[], write: (batch: WriteBatch, item: T) => void, size = 400) {
  for (let i = 0; i < items.length; i += size) {
    const batch = writeBatch(db);
    items.slice(i, i + size).forEach((item) => write(batch, item));
    await batch.commit();
  }
}

// ---------- Seasons ----------

export async function createSeason(input: { id: string; name: string; startDate: Date; endDate: Date; createdBy: string }) {
  const ref = doc(db, 'seasons', input.id);
  if ((await getDoc(ref)).exists()) throw new Error(`A season with id "${input.id}" already exists.`);
  const batch = writeBatch(db);
  batch.set(ref, {
    name: input.name,
    status: 'closed',
    startDate: Timestamp.fromDate(input.startDate),
    endDate: Timestamp.fromDate(input.endDate),
    createdBy: input.createdBy,
  });
  await batch.commit();
}

async function currentStandings(seasonId: string): Promise<HouseStanding[]> {
  const snap = await getDocs(collection(db, 'houses'));
  return snap.docs
    .filter((d) => d.data().seasonId === seasonId)
    .map((d) => ({ houseId: d.id as HouseId, totalPoints: d.data().totalPoints ?? 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

export async function closeSeason(seasonId: string) {
  const finalStandings = await currentStandings(seasonId);
  const batch = writeBatch(db);
  batch.update(doc(db, 'seasons', seasonId), { status: 'closed', finalStandings, closedAt: serverTimestamp() });
  await batch.commit();
}

/**
 * Makes a season the active one: closes any other active season (saving its final
 * standings), moves every house and member into the new season, and recomputes
 * totals from that season's existing awards (zero for a brand-new season).
 */
export async function activateSeason(seasonId: string) {
  const seasons = await getDocs(collection(db, 'seasons'));
  for (const s of seasons.docs) {
    if (s.id !== seasonId && s.data().status === 'active') await closeSeason(s.id);
  }

  const batch = writeBatch(db);
  batch.update(doc(db, 'seasons', seasonId), { status: 'active' });
  await batch.commit();

  const users = await getDocs(collection(db, 'users'));
  await chunkedWrites(users.docs, (b, u) => b.update(u.ref, { seasonId }));
  await recomputeSeasonTotals(seasonId, true);
}

/** Rebuilds denormalized totals from the points collection. */
export async function recomputeSeasonTotals(seasonId: string, moveHouses = false) {
  const [pointsSnap, housesSnap, usersSnap] = await Promise.all([
    getDocs(query(collection(db, 'points'), where('seasonId', '==', seasonId))),
    getDocs(collection(db, 'houses')),
    getDocs(query(collection(db, 'users'), where('seasonId', '==', seasonId))),
  ]);
  const { byStudent, byHouse } = tallyPoints(
    pointsSnap.docs.map((d) => ({ studentId: d.data().studentId, houseId: d.data().houseId, amount: d.data().amount })),
  );

  const houseDocs = housesSnap.docs.filter((d) => moveHouses || d.data().seasonId === seasonId);
  await chunkedWrites(houseDocs, (b, h) =>
    b.update(h.ref, { seasonId, totalPoints: byHouse.get(h.id) ?? 0 }),
  );
  await chunkedWrites(usersSnap.docs, (b, u) => b.update(u.ref, { totalPoints: byStudent.get(u.id) ?? 0 }));
}

// ---------- People ----------

export interface NewUser {
  email: string;
  displayName: string;
  role: Role;
  houseId: HouseId | null;
}

function userDoc(u: NewUser, seasonId: string) {
  const id = userKey(u.email);
  const sorted = u.role === 'student' && !!u.houseId;
  return {
    id,
    data: {
      email: id,
      displayName: u.displayName.trim(),
      role: u.role,
      houseId: u.houseId,
      sorted,
      sortedAt: sorted ? serverTimestamp() : null,
      seasonId,
      totalPoints: 0,
      createdAt: serverTimestamp(),
    },
  };
}

export async function addUser(u: NewUser, seasonId: string) {
  const { id, data } = userDoc(u, seasonId);
  const ref = doc(db, 'users', id);
  if ((await getDoc(ref)).exists()) throw new Error(`${id} is already on the house rolls.`);
  const batch = writeBatch(db);
  batch.set(ref, data);
  if (u.role !== 'student' && u.houseId) {
    batch.update(doc(db, 'houses', u.houseId), { advisors: arrayUnion(id) });
  }
  await batch.commit();
}

/** Adds one unsorted student — they get a house at the sorting ceremony. */
export function addStudent(name: string, email: string, seasonId: string) {
  return addUser({ email, displayName: name, role: 'student', houseId: null }, seasonId);
}

/** Bulk-creates unsorted students. Emails already on the rolls are skipped. */
export async function importStudents(rows: Array<{ name: string; email: string }>, seasonId: string, existingIds: Set<string>) {
  const fresh = rows.filter((r) => !existingIds.has(userKey(r.email)));
  await chunkedWrites(fresh, (b, r) => {
    const { id, data } = userDoc({ email: r.email, displayName: r.name, role: 'student', houseId: null }, seasonId);
    b.set(doc(db, 'users', id), data);
  });
  return { created: fresh.length, skipped: rows.length - fresh.length };
}

/**
 * Direct assignment (transfers, late adds, corrections) — bypasses the ceremony but still
 * marks the student sorted. If they already earned points this season, those awards move
 * with them and both house totals are adjusted.
 */
export async function assignHouse(student: AppUser, houseId: HouseId) {
  if (student.houseId === houseId && student.sorted) return { moved: 0 };
  const from = student.houseId;
  const pointsSnap = from
    ? await getDocs(query(collection(db, 'points'), where('studentId', '==', student.id), where('seasonId', '==', student.seasonId)))
    : null;
  const awards = pointsSnap?.docs ?? [];
  const moved = awards.reduce((sum, d) => sum + (d.data().amount ?? 0), 0);

  const batch = writeBatch(db);
  batch.update(doc(db, 'users', student.id), { houseId, sorted: true, sortedAt: serverTimestamp() });
  if (from && from !== houseId && moved > 0) {
    batch.update(doc(db, 'houses', from), { totalPoints: increment(-moved) });
    batch.update(doc(db, 'houses', houseId), { totalPoints: increment(moved) });
  }
  await batch.commit();

  if (from && from !== houseId) {
    await chunkedWrites(awards, (b, d) => b.update(d.ref, { houseId }));
  }
  return { moved };
}

export async function setAdvisorHouse(user: AppUser, houseId: HouseId | null) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', user.id), { houseId });
  for (const id of HOUSE_IDS) {
    batch.update(doc(db, 'houses', id), { advisors: id === houseId ? arrayUnion(user.id) : arrayRemove(user.id) });
  }
  await batch.commit();
}

export async function setUserRole(user: AppUser, role: Role) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', user.id), { role });
  await batch.commit();
}

export async function removeUser(user: AppUser) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', user.id));
  if (user.role !== 'student') {
    for (const id of HOUSE_IDS) batch.update(doc(db, 'houses', id), { advisors: arrayRemove(user.id) });
  }
  await batch.commit();
}

// ---------- Setup ----------

/** Creates the four house documents for a season if they don't exist yet. */
export async function ensureHouses(seasonId: string) {
  const snap = await getDocs(collection(db, 'houses'));
  const existing = new Set(snap.docs.map((d) => d.id));
  const batch = writeBatch(db);
  for (const id of HOUSE_IDS) {
    if (existing.has(id)) continue;
    const { icon: _icon, pantherPose: _pose, ...meta } = HOUSES[id];
    batch.set(doc(db, 'houses', id), { ...meta, totalPoints: 0, seasonId, advisors: [] });
  }
  await batch.commit();
}

/**
 * Loads the demo roster (16 sorted students, 8 unsorted, 3 faculty, 10 awards) into the active season,
 * creating the 2026-2027 season and houses if needed. Safe to run more than once.
 * Creates Firestore records only — use the seed script to create demo sign-in accounts.
 */
export async function loadDemoData(activeSeason: Season | null) {
  const now = new Date();
  let seasonId = activeSeason?.id;

  if (!seasonId) {
    const s = seedSeason(now);
    seasonId = s.id;
    const batch = writeBatch(db);
    batch.set(doc(db, 'seasons', s.id), {
      name: s.name,
      status: 'active',
      startDate: Timestamp.fromDate(s.startDate),
      endDate: Timestamp.fromDate(s.endDate),
      createdBy: s.createdBy,
    });
    await batch.commit();
  }

  const housesSnap = await getDocs(collection(db, 'houses'));
  const existingHouses = new Set(housesSnap.docs.map((d) => d.id));
  const houseBatch = writeBatch(db);
  for (const h of seedHouses(seasonId, [...SEED_FACULTY, SEED_ADMIN])) {
    const { id, icon: _icon, pantherPose: _pose, advisors, ...rest } = h;
    const ref = doc(db, 'houses', id);
    if (existingHouses.has(id)) houseBatch.update(ref, { seasonId, advisors: arrayUnion(...advisors) });
    else houseBatch.set(ref, { ...rest, seasonId, advisors });
  }
  await houseBatch.commit();

  const usersSnap = await getDocs(collection(db, 'users'));
  const existingUsers = new Set(usersSnap.docs.map((d) => d.id));
  const people = [...SEED_STUDENTS, ...SEED_UNSORTED, ...SEED_FACULTY, SEED_ADMIN].filter((p) => !existingUsers.has(userKey(p.email)));
  await chunkedWrites(people, (b, p) => {
    const { id, data } = userDoc(p, seasonId);
    b.set(doc(db, 'users', id), data);
  });

  const names = new Map([...SEED_STUDENTS, ...SEED_FACULTY, SEED_ADMIN].map((p) => [p.email, p]));
  await chunkedWrites(SEED_POINTS, (b, p) => {
    const student = names.get(p.studentEmail)!;
    b.set(doc(db, 'points', `${seasonId}-${p.id}`), {
      studentId: p.studentEmail,
      studentName: student.displayName,
      houseId: student.houseId,
      seasonId,
      category: p.category,
      amount: p.amount,
      note: p.note,
      awardedBy: p.awardedBy,
      awardedByName: names.get(p.awardedBy)?.displayName ?? p.awardedBy,
      awardedAt: Timestamp.fromDate(seedPointDate(p, now)),
    });
  });

  await recomputeSeasonTotals(seasonId);
  return { seasonId, peopleCreated: people.length, pointsWritten: SEED_POINTS.length };
}
