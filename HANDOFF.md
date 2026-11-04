# CMII Den Points — Handoff

For the faculty admins who run it. No coding needed for anything below.

**Live site:** https://cmii-house.vercel.app  ·  **Admin panel:** sign in, then *Admin* in the menu.

## Who can do what

| Role | Can do |
|---|---|
| **Admin** | Everything: seasons, add/remove people, assign houses, revoke points, audit log |
| **Faculty** | Award points, view rosters, run the sorting ceremony |
| **Read-only admin** | View the admin panel, stats, audit log and rosters. Changes nothing |
| **Student** | See their house, points, leaderboard. **House Leader** students (flag set in *Admin → Students → Lead*) also see their own house's roster |

Everyone signs in with **Google**, using **either a GSU or a Gmail address**, but only if an admin has added that exact address to the list first. Adding someone only puts them on the list. The app sends no email.

## Everyday tasks

- **Add a person:** *Admin → Students* (or *Faculty* tab for staff). After adding, copy the invite text that appears and send it from your own email.
- **Remove a person:** the ✕ next to their name. A student with points must have their awards revoked first (*Audit Log → Revoke*).
- **Make a house leader:** *Admin → Students → Lead*.
- **Sort new students into houses:** *Sorting Ceremony* page.
- **Fix a mistaken award:** *Audit Log → Revoke* (totals adjust automatically).

## Each year (season rollover)

1. *Admin → Seasons → Create a season* (the id is the academic year, e.g. 2027-2028).
2. **Activate** it. This closes the old season and saves its final standings. All houses and members move into the new season, and totals start at zero. Old points stay in the audit log.
3. Add or import the new students. Remove graduates.

## Where everything lives (the fragile part)

| Piece | What it is | Owner today |
|---|---|---|
| **Firebase** project `cmiihouse` | Database and sign-in | Olaiya's Google account |
| **Vercel** project `cmii-house` | Hosts the website, redeploys when code changes | Olaiya's account |
| **GitHub** `EducatedsheBrat/CMIIHouse` | The code | Olaiya's account |

The app keeps running without any change, but **if the owner's account is removed, you lose the ability to manage the database, redeploy, or fix anything.** Before leaving, make a second person an **Owner** on all three:

- Firebase console → Project settings → Users and permissions → Add member → *Owner*
- Vercel → project → Settings → Members (or transfer the project to a team)
- GitHub → repo → Settings → Collaborators (or transfer the repo)

## If something looks wrong

- **Someone can't sign in:** they must use the same email you added (GSU or Gmail), and Google must be on that account. Check they're on the list.
- **"Not on the rolls" message:** the email doesn't match a person on the list (check spelling, `student.gsu.edu` vs `gsu.edu`).
- **Points look off:** *Admin → Seasons → Recalculate totals*.
