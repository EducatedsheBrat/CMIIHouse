/**
 * Seeds Firestore (and Firebase Auth demo accounts) for CMII Den Points.
 *
 *   npx ts-node src/scripts/seed.ts                      # real project (needs a service account)
 *   npx ts-node src/scripts/seed.ts --emulator           # local emulators (npm run emulators)
 *   npx ts-node src/scripts/seed.ts --admin-email=you@gsu.edu --admin-name="Your Name"
 *   npx ts-node src/scripts/seed.ts --minimal --admin-email=you@gsu.edu   # production: season, houses, your admin only
 *
 * --minimal skips the demo roster, awards, and demo email/password accounts. Use it for real
 * projects: the demo accounts (including an admin) share a password published in the README.
 *
 * Real projects need a service-account key (Firebase console → Project settings → Service accounts →
 * Generate new private key). Save it as service-account.json in the project root (git-ignored),
 * or point GOOGLE_APPLICATION_CREDENTIALS at it.
 * The project id is read from NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local, or --project=<id>.
 *
 * Safe to re-run: documents use fixed ids, existing people keep their data, and
 * house/student totals are recomputed from every award in the season.
 */

import * as fs from 'fs';
import * as path from 'path';
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { HOUSES, userKey, type HouseId } from '../lib/constants';
import {
  DEMO_PASSWORD,
  SEED_ADMIN,
  SEED_FACULTY,
  SEED_POINTS,
  SEED_STUDENTS,
  SEED_UNSORTED,
  seedHouses,
  seedPointDate,
  seedSeason,
  tallyPoints,
  type SeedUser,
} from '../lib/seedData';

// ---------- CLI ----------

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}
const useEmulator = process.argv.includes('--emulator');
const minimal = process.argv.includes('--minimal');
const skipAuth = minimal || process.argv.includes('--no-auth');

if (minimal && !arg('admin-email')) {
  console.error('✖ --minimal needs --admin-email=you@gsu.edu so someone can sign in and run the admin panel.');
  process.exit(1);
}

function readEnvFile(file: string): Record<string, string> {
  const full = path.resolve(process.cwd(), file);
  if (!fs.existsSync(full)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(full, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/))
      .filter((m): m is RegExpMatchArray => !!m)
      .map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]),
  );
}

const env = { ...readEnvFile(useEmulator ? '.env.emulator' : '.env.local'), ...process.env };
const projectId = arg('project') ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? (useEmulator ? 'demo-leaderquest' : undefined);

if (!projectId) {
  console.error('✖ No project id. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local or pass --project=<id>.');
  process.exit(1);
}

if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
}

function credential() {
  const local = path.resolve(process.cwd(), 'service-account.json');
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(local)) return cert(local);
  return applicationDefault();
}

const app = initializeApp(useEmulator ? { projectId } : { projectId, credential: credential() });
const db = getFirestore(app);
const auth = getAuth(app);

// ---------- Seed ----------

const extraAdmin: SeedUser | null = arg('admin-email')
  ? { email: userKey(arg('admin-email')!), displayName: arg('admin-name') ?? 'CMII Admin', role: 'admin', houseId: null }
  : null;

async function ensureAuthAccount(user: SeedUser): Promise<string | undefined> {
  if (skipAuth) return undefined;
  try {
    const existing = await auth.getUserByEmail(user.email);
    return existing.uid;
  } catch (err) {
    if ((err as { code?: string }).code !== 'auth/user-not-found') throw err;
    const created = await auth.createUser({ email: user.email, password: DEMO_PASSWORD, displayName: user.displayName, emailVerified: true });
    return created.uid;
  }
}

async function main() {
  console.log(`\n⚜  Seeding CMII Den Points → ${projectId}${useEmulator ? ' (emulator)' : ''}${minimal ? ' — minimal' : ''}\n`);
  const now = new Date();
  const season = { ...seedSeason(now), ...(minimal && extraAdmin ? { createdBy: extraAdmin.email } : {}) };

  // Season — keep an existing season's status so re-running never reopens a closed season.
  const seasonRef = db.doc(`seasons/${season.id}`);
  const seasonSnap = await seasonRef.get();
  const otherActive = await db.collection('seasons').where('status', '==', 'active').get();
  const status = seasonSnap.exists ? seasonSnap.get('status') : otherActive.empty ? 'active' : 'closed';
  await seasonRef.set(
    {
      name: season.name,
      status,
      startDate: Timestamp.fromDate(season.startDate),
      endDate: Timestamp.fromDate(season.endDate),
      createdBy: season.createdBy,
    },
    { merge: true },
  );
  console.log(`  ✓ season ${season.id} (${status})`);

  // Houses
  const advisors = minimal ? [] : [...SEED_FACULTY, SEED_ADMIN];
  for (const h of seedHouses(season.id, advisors)) {
    const { id, icon: _icon, pantherPose: _pose, advisors: houseAdvisors, ...rest } = h;
    const ref = db.doc(`houses/${id}`);
    const snap = await ref.get();
    if (snap.exists) await ref.update({ seasonId: season.id, advisors: FieldValue.arrayUnion(...houseAdvisors) });
    else await ref.set({ ...rest, seasonId: season.id, advisors: houseAdvisors });
  }
  console.log('  ✓ houses: Lumina, Doron, Asé, Kaizen');

  // People
  const demoPeople = minimal ? [] : [...SEED_STUDENTS, ...SEED_UNSORTED, ...SEED_FACULTY, SEED_ADMIN];
  const people: SeedUser[] = [...demoPeople, ...(extraAdmin ? [extraAdmin] : [])];
  let created = 0;
  for (const person of people) {
    const id = userKey(person.email);
    const isExtraAdmin = person === extraAdmin;
    const uid = isExtraAdmin ? undefined : await ensureAuthAccount(person);
    const ref = db.doc(`users/${id}`);
    const snap = await ref.get();
    if (snap.exists) {
      if (isExtraAdmin) await ref.update({ role: 'admin' });
      continue;
    }
    await ref.set({
      email: id,
      displayName: person.displayName,
      role: person.role,
      houseId: person.houseId,
      sorted: person.role === 'student' && !!person.houseId,
      sortedAt: person.role === 'student' && person.houseId ? Timestamp.fromDate(season.startDate) : null,
      seasonId: season.id,
      totalPoints: 0,
      createdAt: Timestamp.now(),
      ...(uid ? { uid } : {}),
    });
    created++;
  }
  console.log(
    minimal
      ? `  ✓ people: admin ${extraAdmin?.email} (${created} new)`
      : `  ✓ people: ${SEED_STUDENTS.length} sorted + ${SEED_UNSORTED.length} unsorted students, ${SEED_FACULTY.length} faculty, ${extraAdmin ? 2 : 1} admin (${created} new)`,
  );

  // Points
  const byEmail = new Map(people.map((p) => [p.email, p]));
  const batch = db.batch();
  for (const p of minimal ? [] : SEED_POINTS) {
    const student = byEmail.get(p.studentEmail)!;
    batch.set(db.doc(`points/${season.id}-${p.id}`), {
      studentId: p.studentEmail,
      studentName: student.displayName,
      houseId: student.houseId,
      seasonId: season.id,
      category: p.category,
      amount: p.amount,
      note: p.note,
      awardedBy: p.awardedBy,
      awardedByName: byEmail.get(p.awardedBy)?.displayName ?? p.awardedBy,
      awardedAt: Timestamp.fromDate(seedPointDate(p, now)),
    });
  }
  await batch.commit();
  if (!minimal) console.log(`  ✓ points: ${SEED_POINTS.length} awards`);

  // Totals, recomputed from every award in the season.
  const allPoints = await db.collection('points').where('seasonId', '==', season.id).get();
  const { byStudent, byHouse } = tallyPoints(allPoints.docs.map((d) => ({ studentId: d.get('studentId'), houseId: d.get('houseId'), amount: d.get('amount') })));
  const totals = db.batch();
  for (const id of Object.keys(HOUSES) as HouseId[]) totals.update(db.doc(`houses/${id}`), { totalPoints: byHouse.get(id) ?? 0 });
  const students = await db.collection('users').where('seasonId', '==', season.id).get();
  students.docs.forEach((d) => totals.update(d.ref, { totalPoints: byStudent.get(d.id) ?? 0 }));
  await totals.commit();

  console.log('\n  Standings:');
  for (const [id, pts] of [...byHouse.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${HOUSES[id as HouseId].name.padEnd(8)} ${String(pts).padStart(5)} pts`);
  }

  if (!skipAuth) {
    console.log('\n  Demo sign-in (email/password):');
    console.log(`    admin    ${SEED_ADMIN.email}`);
    console.log(`    faculty  ${SEED_FACULTY[0].email}`);
    console.log(`    student  ${SEED_STUDENTS[0].email}`);
    console.log(`    password ${DEMO_PASSWORD}`);
  }
  if (extraAdmin) console.log(`\n  ${extraAdmin.email} is an admin — sign in with Google.`);
  console.log('\n⚜  Done.\n');
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error('\n✖ Seed failed:', err);
    process.exit(1);
  },
);
