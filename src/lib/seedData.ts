// Demo data shared by the Node seed script (firebase-admin) and the in-app
// "Load demo data" admin action (client SDK). Plain objects only — each caller
// converts Dates into its own SDK's Timestamp type.

import { HOUSES, HOUSE_IDS, type CategoryKey, type HouseId, type Role } from './constants';

export const DEMO_SEASON_ID = '2026-2027';
export const DEMO_PASSWORD = 'LeaderQuest-demo-2026';
export const DEMO_ADMIN_EMAIL = 'demo.admin@gsu.edu';

export interface SeedUser {
  email: string;
  displayName: string;
  role: Role;
  houseId: HouseId | null;
}

export interface SeedPoint {
  id: string;
  studentEmail: string;
  category: CategoryKey;
  amount: number;
  note: string;
  awardedBy: string;
  daysAgo: number;
  hour: number;
}

const STUDENT_NAMES: Record<HouseId, string[]> = {
  lumina: ['Maya Okafor', 'Jordan Ellis', 'Priya Raman', 'Marcus Bell'],
  doron: ['Aaliyah Brooks', 'Diego Santos', 'Hannah Kim', 'Tyrese Coleman'],
  ase: ['Zora Adeyemi', 'Liam Nguyen', 'Imani Carter', 'Sofia Reyes'],
  kaizen: ['Kenji Watanabe', 'Nia Thompson', 'Caleb Foster', 'Amara Diallo'],
};

function demoEmail(name: string, domain: string): string {
  return `demo.${name.toLowerCase().replace(/[^a-z]+/g, '.')}@${domain}`;
}

export const SEED_STUDENTS: SeedUser[] = HOUSE_IDS.flatMap((houseId) =>
  STUDENT_NAMES[houseId].map((displayName) => ({
    email: demoEmail(displayName, 'student.gsu.edu'),
    displayName,
    role: 'student' as const,
    houseId,
  })),
);

/** Incoming students with no house yet — they give the sorting ceremony someone to sort. */
export const SEED_UNSORTED: SeedUser[] = [
  'Jaylen Harris',
  'Camila Ortiz',
  'Noah Bennett',
  'Aisha Mensah',
  'Ethan Brooks',
  'Grace Liu',
  'Malik Johnson',
  'Zara Ahmed',
].map((displayName) => ({ email: demoEmail(displayName, 'student.gsu.edu'), displayName, role: 'student' as const, houseId: null }));

export const SEED_FACULTY: SeedUser[] = [
  { email: 'demo.renee.whitfield@gsu.edu', displayName: 'Dr. Renee Whitfield', role: 'faculty', houseId: 'lumina' },
  { email: 'demo.andre.mitchell@gsu.edu', displayName: 'Prof. Andre Mitchell', role: 'faculty', houseId: 'doron' },
  { email: 'demo.lena.park@gsu.edu', displayName: 'Dr. Lena Park', role: 'faculty', houseId: 'ase' },
];

export const SEED_ADMIN: SeedUser = {
  email: DEMO_ADMIN_EMAIL,
  displayName: 'CMII House Admin',
  role: 'admin',
  houseId: 'kaizen',
};

const s = (name: string) => demoEmail(name, 'student.gsu.edu');
const [whitfield, mitchell, park] = SEED_FACULTY.map((f) => f.email);

export const SEED_POINTS: SeedPoint[] = [
  { id: 'seed-01', studentEmail: s('Maya Okafor'), category: 'academic', amount: 90, note: 'Top score on the Media Theory midterm.', awardedBy: whitfield, daysAgo: 12, hour: 10 },
  { id: 'seed-02', studentEmail: s('Diego Santos'), category: 'participation', amount: 10, note: 'Showed up early to help set up the CMII open house.', awardedBy: mitchell, daysAgo: 11, hour: 14 },
  { id: 'seed-03', studentEmail: s('Zora Adeyemi'), category: 'challenge', amount: 300, note: 'Won the 48-hour short film house challenge.', awardedBy: park, daysAgo: 9, hour: 17 },
  { id: 'seed-04', studentEmail: s('Kenji Watanabe'), category: 'service', amount: 40, note: 'Volunteered at the Atlanta Community Food Bank.', awardedBy: DEMO_ADMIN_EMAIL, daysAgo: 8, hour: 9 },
  { id: 'seed-05', studentEmail: s('Hannah Kim'), category: 'character', amount: 50, note: 'Mentored first-years through their first edit session.', awardedBy: mitchell, daysAgo: 6, hour: 11 },
  { id: 'seed-06', studentEmail: s('Priya Raman'), category: 'service', amount: 30, note: 'Organized the campus clean-up crew.', awardedBy: whitfield, daysAgo: 5, hour: 15 },
  { id: 'seed-07', studentEmail: s('Nia Thompson'), category: 'challenge', amount: 250, note: 'Second place in the game jam house challenge.', awardedBy: DEMO_ADMIN_EMAIL, daysAgo: 4, hour: 16 },
  { id: 'seed-08', studentEmail: s('Imani Carter'), category: 'academic', amount: 75, note: 'Outstanding portfolio review.', awardedBy: park, daysAgo: 2, hour: 13 },
  { id: 'seed-09', studentEmail: s('Tyrese Coleman'), category: 'academic', amount: 100, note: 'Perfect score on the audio production final.', awardedBy: mitchell, daysAgo: 1, hour: 10 },
  { id: 'seed-10', studentEmail: s('Jordan Ellis'), category: 'participation', amount: 8, note: 'Asked the best question at the guest speaker panel.', awardedBy: whitfield, daysAgo: 0, hour: 9 },
];

export function seedSeason(now = new Date()) {
  const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return {
    id: DEMO_SEASON_ID,
    name: '2026-2027 Academic Year',
    status: 'active' as const,
    startDate: new Date(year, 7, 17),
    endDate: new Date(year + 1, 4, 7),
    createdBy: DEMO_ADMIN_EMAIL,
  };
}

export function seedHouses(seasonId: string, advisors: SeedUser[]) {
  return HOUSE_IDS.map((id) => ({
    ...HOUSES[id],
    totalPoints: 0,
    seasonId,
    advisors: advisors.filter((a) => a.houseId === id).map((a) => a.email),
  }));
}

export function seedPointDate(point: SeedPoint, now = new Date()): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - point.daysAgo);
  d.setHours(point.hour, 0, 0, 0);
  // Never schedule a demo award in the future.
  return d > now ? new Date(now.getTime() - 60_000) : d;
}

/** Sums point totals per student and per house. */
export function tallyPoints(points: Array<{ studentId: string; houseId: string; amount: number }>) {
  const byStudent = new Map<string, number>();
  const byHouse = new Map<string, number>();
  for (const p of points) {
    byStudent.set(p.studentId, (byStudent.get(p.studentId) ?? 0) + p.amount);
    byHouse.set(p.houseId, (byHouse.get(p.houseId) ?? 0) + p.amount);
  }
  return { byStudent, byHouse };
}
