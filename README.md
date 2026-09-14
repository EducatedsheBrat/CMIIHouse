# LeaderQuest — CMII House System

A Progressive Web App for the Creative Media Industries Institute house system at Georgia State University. Faculty award points to students, students are sorted into four houses (Lumina, Doron, Asé, Kaizen), and the houses compete for the **CMII Media Cup**.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 3 · Firebase (Auth + Firestore) · next-pwa · deployed on Vercel.

---

## Quick start (fully local, no Firebase project needed)

Requires Node 20+ and **Java 21+** (for the Firebase emulators) plus the Firebase CLI (`npm i -g firebase-tools`).

```bash
npm install
npm run emulators      # terminal 1 — Auth :9099, Firestore :8080, UI :4000
npm run seed:emu       # terminal 2 — season, houses, 16 sorted + 8 unsorted students, 3 faculty, 10 awards
npm run dev:emu        # terminal 2 — http://localhost:3000
```

`dev:emu` loads `.env.emulator` (the `NEXT_PUBLIC_*` values for the demo project) through `scripts/with-env.mjs`, since Next.js has no `--mode` flag.

Demo sign-in (email/password), all with password `LeaderQuest-demo-2026`:

| Role    | Email                               | Lands on     |
|---------|-------------------------------------|--------------|
| Admin   | `demo.admin@gsu.edu`                | `/admin`     |
| Faculty | `demo.renee.whitfield@gsu.edu`      | `/award`     |
| Student | `demo.maya.okafor@student.gsu.edu`  | `/dashboard` |
| Unsorted student | `demo.zara.ahmed@student.gsu.edu` | `/dashboard` (awaiting the ceremony) |

To try the sorting ceremony, sign in as the admin or faculty account and open `/ceremony`. The seed leaves 8 students unsorted.

## Connecting a real Firebase project

1. Create a Firebase project. Enable **Authentication → Google** and **Email/Password**. Create a **Firestore** database in production mode.
2. Add a Web app, then copy `.env.local.example` → `.env.local` and fill in the `NEXT_PUBLIC_FIREBASE_*` values. Next.js inlines these at build time, so restart `npm run dev` after changing them.
3. Deploy the security rules and indexes:
   ```bash
   firebase use --add            # pick your project
   npm run deploy:rules
   ```
4. Seed the season and houses and make yourself an admin. Download a service-account key (Project settings → Service accounts → Generate new private key), save it as `service-account.json` in the project root (it's git-ignored), then run:
   ```bash
   npx ts-node src/scripts/seed.ts --minimal --admin-email=you@gsu.edu --admin-name="Your Name"
   ```
   **Use `--minimal` on real projects.** Without it the script also creates the demo roster and demo email/password accounts, including an admin, whose shared password is printed above. To explore with sample students on a real project, use **Admin → Seasons → Load demo data** instead, which adds records but no sign-in accounts. The admin must be a `@gsu.edu` address (see the security rules).
5. `npm run dev`, then sign in with Google as the admin email.

## Deploying to Vercel

1. Import the repo in Vercel. Next.js is detected automatically; no `vercel.json` is needed. The build command comes from `package.json` (`next build --webpack`, which next-pwa requires).
2. Add every `NEXT_PUBLIC_FIREBASE_*` variable from `.env.local` to the Vercel project's environment variables **before** the first build (they're baked into the bundle). Set `NEXT_PUBLIC_ENABLE_EMAIL_LOGIN=false` for production if everyone signs in with Google.
3. In Firebase → Authentication → Settings → **Authorized domains**, add your `*.vercel.app` domain (and any custom domain).

---

## How it works

### Project structure

```
src/
  app/                      App Router: routes, layouts, metadata
    layout.tsx              <html>, next/font (Cinzel Decorative, Cinzel, Inter), metadata, providers
    providers.tsx           AuthProvider + toasts (client); shows setup help if Firebase env vars are missing
    (main)/layout.tsx       header + sidebar/tab bar for every page in the group
    (main)/page.tsx         public leaderboard ("/"), plus leaderboard/, award/, roster/, activity/,
                            dashboard/, ceremony/, admin/, admin/students/
    kiosk/                  bare full-screen layout for the hallway TV
    login/                  full-bleed sign-in page
    not-found.tsx
  components/               UI (all client components) — leaderboard, award, roster, feed, dashboard,
                            ceremony, admin, auth, layout, shared
  hooks/                    Firestore/auth hooks (useAuth, useHouses, useStudents, usePoints, useSeason,
                            useSorting, useSearchParam, useFlip)
  lib/                      firebase.ts, types, constants, sorting, adminActions, seedData, utils
  assets/panthers/          generated panther SVGs + index.ts (their markup as string exports)
  styles/ceremony.css       wheel, panther run, reveal animations
  scripts/seed.ts           Node seed script (firebase-admin)
```

- **Pages are thin server components** that export `metadata` and render a client component. Protected pages wrap it in `<ProtectedPage allowedRoles={[…]}>`, which redirects signed-out visitors to `/login?next=…` and members without the role to their own home page. Firestore security rules are still the real enforcement.
- **Query params** (`?student=`, `?house=`, `?tab=`, `?next=`) go through `useSearchParam`. `ProtectedPage` and the login page provide the `<Suspense>` boundary that `useSearchParams` needs, so every route still prerenders statically.
- **Firebase is browser-only.** `src/lib/firebase.ts` initializes nothing during prerendering, and every Firestore/Auth call happens in effects or event handlers.
- **Lint:** `npm run lint` passes the React Compiler rules in `eslint-config-next` (no `setState` inside effects, no ref access during render, pure render functions). Firestore hooks tag each snapshot with the query it answers, rather than resetting state when inputs change.

### Identity: user documents are keyed by email

The spec keyed `users/{uid}`, but admins provision students and faculty **before they ever sign in**, so the Firebase uid doesn't exist yet. User documents are keyed by the lowercase GSU email instead (`users/jane.doe@gsu.edu`). On sign-in the app reads the document matching the verified email on the auth token and records the uid on it. Everything that referenced a uid (`points.studentId`, `points.awardedBy`, `houses.advisors`) holds this email key.

### Security rules (`firestore.rules`)

Enforced server-side, and covered by 30 emulator tests (`npm run test:rules`):

- **Domain restriction:** only verified emails on `gsu.edu` or a subdomain (e.g. `student.gsu.edu`) count as members. An unverified email can't impersonate anyone.
- **Houses and seasons are publicly readable** so the hallway kiosk works signed out. Users and points need membership.
- **Awards are validated in the rules:** category range, `awardedBy` must be the caller, the season must be active, and the student must belong to the credited house.
- **Denormalized totals can't be forged.** A faculty member may change only `totalPoints` and `lastPointId` on a house or student, only by exactly the amount of a point document created in the *same transaction* (`getAfter`/`existsAfter`). The original spec rules would have rejected every award, since faculty couldn't touch house totals, and would have let students edit their own `role` and `totalPoints`.
- Students can update only `uid`, `photoURL`, and `lastLoginAt` on their own document.
- **Sorting:** faculty may move an *unsorted* student into a valid house (`sortedAt` must be the server time), or undo a sort made in the last hour for a student with no points. Only admins can move a student who already has a house. Unsorted students can't receive points.

### Data model additions

Beyond the spec: `points.studentName` / `points.awardedByName` (the feed and audit log render without extra reads), `lastPointId` on users and houses (used by the rules above), `users.uid` / `photoURL` / `lastLoginAt`, and `seasons.finalStandings` / `closedAt` (written when a season closes).

### Panther mascots

Five SVG panthers live in `src/assets/panthers/`: Lumina (seated, head raised), Doron (paw extended), Asé (roaring mid-leap), Kaizen (in stride), and the neutral black panther. There's also `panther-run-sprite.svg`, which carries its own run-cycle animation. All of them come from **one articulated rig** in `scripts/generate-panthers.mjs`, so the silhouettes stay consistent. Edit a pose's joint angles and run `npm run panthers` (add `-- --preview` for a PNG contact sheet and a strip of the gallop phases). The generator also writes `index.ts`, which exports each SVG's markup as a string, so no bundler loader is needed. Colors are CSS custom properties (`--lqp-accent`, `--lqp-eye`, and others), and `<Panther house="…" />` inlines them with unique gradient ids.

### Sorting ceremony (`/ceremony`)

- **Auto-balance** (`src/lib/sorting.ts`): the house is picked *before* the wheel spins. Houses at the minimum size get 3× weight, houses one ahead get 1×, and houses two or more ahead get none. The gap between the largest and smallest house therefore never exceeds 2, and the wheel still looks random. Unit tests: `npm test`.
- **Wheel:** a CSS `conic-gradient` rotor. **Spin** runs a 0.3s linear infinite rotation. **Stop** (or the random 3–5s auto-stop) reads the live angle from the computed transform, then transitions 2.5s with `cubic-bezier(0.15, 0.85, 0.35, 1)` to land on the pre-chosen house, adding 3–5 extra turns and landing at a random point inside the section.
- **Panther:** the run cycle is CSS keyframes on the rig's leg joints. While the wheel decelerates, the animations' `playbackRate` follows the slope of the same bezier curve, so the panther slows in step with the wheel. It runs in place with a slight drift over a scrolling ground line, so it stops centered, then warms into the house color and crossfades to the house pose.
- **Saving:** the Firestore write (`houseId`, `sorted: true`, `sortedAt`) runs while the wheel slows. The reveal only plays once the write succeeds; otherwise the student stays in the queue with an error.
- **Controls:** space bar spins, stops, and continues. **Present** takes the ceremony full screen for a projector. **Undo** returns the most recent student to the queue.

### Offline and PWA

- **next-pwa** generates `public/sw.js` (Workbox) during `npm run build`. It's a webpack plugin, so production builds use `next build --webpack`; it's skipped in `next dev`, which stays on Turbopack. Test the service worker with `npm run build && npm start`.
- next-pwa 5's auto-registration only hooks the Pages Router entry, so `<ServiceWorkerRegistrar />` in the root layout registers `/sw.js`, and the App Router build manifests are excluded from the precache. Verified in Chrome: the worker activates and controls the page, there are no installability errors, and the leaderboard reloads offline with cached standings.
- Firestore's persistent cache (IndexedDB) supplies the last-known standings offline. Fonts are self-hosted by `next/font`, so they work offline too.
- `public/manifest.json` is static and linked from the root layout's `metadata`.
- Install banner: native prompt on Android/Chrome (an inline script catches `beforeinstallprompt` even if it fires before hydration), and "Add to Home Screen" instructions on iOS Safari.
- Regenerate icons (including `favicon.ico`) with `npm run icons`.

### Kiosk (`/kiosk`)

Full-screen, no navigation, sized in viewport units for a hallway TV. Real-time via `onSnapshot`, with a full reload every 30 minutes, a screen wake lock, a hidden idle cursor, and click (or double-click) for full screen. When a house gains points, its banner glows and a “+N” rises from it.

---

## Scripts

| Script               | What it does                                                    |
|----------------------|-----------------------------------------------------------------|
| `npm run dev`        | Next.js dev server (Turbopack) against the project in `.env.local` |
| `npm run dev:emu`    | Dev server against local emulators (`.env.emulator`)            |
| `npm run build`      | Production build (`next build --webpack`, type-checks the app, generates the service worker) |
| `npm start`          | Serve the production build                                      |
| `npm run build:emu` / `start:emu` | Same, wired to the emulators                       |
| `npm run lint`       | ESLint (`eslint-config-next`)                                    |
| `npm run typecheck`  | Type-check app, seed script + tests, and Vitest config            |
| `npm run emulators`  | Start Auth + Firestore emulators                                |
| `npm run seed`       | Seed the real project (`ts-node src/scripts/seed.ts`)           |
| `npm run seed:emu`   | Seed the emulators                                              |
| `npm test`           | Unit tests (auto-balance, wheel geometry, deceleration curve)   |
| `npm run test:rules` | Run security-rules tests in the Firestore emulator              |
| `npm run panthers`   | Regenerate the panther SVGs from the rig                        |
| `npm run deploy:rules` | Deploy `firestore.rules` and `firestore.indexes.json`         |
| `npm run icons`      | Regenerate PWA icons from SVG                                   |

## Admin panel

- **House stats:** members, points, average per member, and points by category for each house. Category sums use Firestore aggregate queries, so no award documents are downloaded.
- **Seasons:** create, activate, and close. Activating closes the previous season (saving its final standings), moves houses and members into the new season, and recomputes totals. It also has "Recalculate totals" (rebuilds totals from the award log) and "Load demo data".
- **Students (`/admin/students`):** CSV import (`name,email`) with a validation preview, and a manual add form that stays open for the next student. Both create *unsorted* students. **Direct assignment** (from this page, or the move button on roster rows) bypasses the ceremony for transfers and corrections; any points already earned this season move to the new house.
- **Faculty:** add faculty or admins, change roles, and assign house advisors.
- **Audit log:** filter by season, house, and category; search; export CSV; revoke an award (subtracts it from both totals).
