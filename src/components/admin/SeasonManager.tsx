'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useHouses } from '../../hooks/useHouses';
import { useSeasons } from '../../hooks/useSeason';
import { activateSeason, closeSeason, createSeason, ensureHouses, loadDemoData, recomputeSeasonTotals, renameSeason } from '../../lib/adminActions';
import { HOUSES } from '../../lib/constants';
import type { Season } from '../../lib/types';
import { cn, formatDate, formatPoints, seasonLabel } from '../../lib/utils';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Crown } from '../shared/Crown';
import { GoldBorder } from '../shared/GoldBorder';
import { Shield } from '../shared/Shield';
import { EmptyState, Notice, SkeletonRows, Spinner } from '../shared/States';
import { useToast } from '../shared/Toast';
import { AdminSection } from './AdminSection';

type Pending =
  | { kind: 'activate'; season: Season }
  | { kind: 'close'; season: Season }
  | { kind: 'demo' }
  | { kind: 'recompute'; season: Season }
  | null;

function suggestSeasonId(seasons: Season[]): string {
  const years = seasons.map((s) => Number(s.id.slice(0, 4))).filter(Number.isFinite);
  const now = new Date();
  const base = years.length ? Math.max(...years) + 1 : now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${base}-${base + 1}`;
}

function StatusBadge({ season }: { season: Season }) {
  const active = season.status === 'active';
  // A closed season that never ran (no final standings) is presented as upcoming.
  const label = active ? 'active' : season.finalStandings ? 'closed' : 'upcoming';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[5px] border px-2 py-0.5 font-heading text-[10px] font-bold uppercase tracking-[0.14em]',
        active ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300' : label === 'upcoming' ? 'border-gold/40 text-gold/80' : 'border-white/20 text-white/50',
      )}
    >
      {active && <span className="h-1.5 w-1.5 animate-live-dot rounded-full bg-emerald-400" />}
      {label}
    </span>
  );
}

/** Inline rename for a season's journey name. */
function SeasonName({ season }: { season: Season }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(season.name);
  const [saving, setSaving] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await renameSeason(season.id, value);
      toast(`Season ${season.id} is now “${value.trim()}”.`, 'success');
      setEditing(false);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <span className="flex items-center gap-2">
        <span className="font-semibold">{season.name || '(unnamed)'}</span>
        <button
          type="button"
          className="btn-text text-[10px]"
          onClick={() => {
            setValue(season.name);
            setEditing(true);
          }}
        >
          Rename
        </button>
      </span>
    );
  }

  return (
    <form onSubmit={save} className="flex items-center gap-2">
      <input
        autoFocus
        className="input max-w-[220px] py-1.5 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="LeaderQuest"
        aria-label={`Name for season ${season.id}`}
      />
      <button type="submit" className="btn btn-gold btn-sm" disabled={saving || !value.trim()}>
        {saving && <Spinner size={12} />}
        Save
      </button>
      <button type="button" className="btn-text text-[10px]" onClick={() => setEditing(false)} disabled={saving}>
        Cancel
      </button>
    </form>
  );
}

export function SeasonManager({ activeSeason }: { activeSeason: Season | null }) {
  const { profile } = useAuth();
  const toast = useToast();
  const { seasons, loading } = useSeasons();
  const { houses, loading: housesLoading } = useHouses();
  const [pending, setPending] = useState<Pending>(null);

  const suggested = suggestSeasonId(seasons);
  const [form, setForm] = useState({ id: '', name: '', start: '', end: '' });
  const [creating, setCreating] = useState(false);
  const [busySetup, setBusySetup] = useState(false);

  const id = form.id || suggested;
  const idValid = /^\d{4}-\d{4}$/.test(id);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !idValid || !form.start || !form.end) return;
    setCreating(true);
    try {
      await createSeason({
        id,
        name: form.name.trim() || `${id} Season`,
        startDate: new Date(`${form.start}T00:00:00`),
        endDate: new Date(`${form.end}T23:59:59`),
        createdBy: profile.id,
      });
      toast(`Season ${id} created. Activate it when you’re ready.`, 'success');
      setForm({ id: '', name: '', start: '', end: '' });
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const foundHouses = async () => {
    if (!activeSeason) return;
    setBusySetup(true);
    try {
      await ensureHouses(activeSeason.id);
      toast('The four houses have been founded.', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusySetup(false);
    }
  };

  const missingHouses = !housesLoading && houses.length < 4;

  return (
    <div className="space-y-5">
      {activeSeason ? (
        <GoldBorder className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Current season</p>
              <h2 className="mt-1 font-display text-2xl font-bold">{seasonLabel(activeSeason)}</h2>
              <p className="mt-1 text-sm text-white/50">
                {formatDate(activeSeason.startDate)} – {formatDate(activeSeason.endDate)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPending({ kind: 'recompute', season: activeSeason })}>
                Recalculate totals
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPending({ kind: 'close', season: activeSeason })}>
                Close season
              </button>
            </div>
          </div>
          {houses.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {houses.map((h) => (
                <div key={h.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-royal/50 px-3 py-2">
                  <Shield houseId={h.id} size={22} />
                  <div className="min-w-0">
                    <p className="truncate font-heading text-xs font-bold">{HOUSES[h.id].name}</p>
                    <p className="scoreboard text-sm text-white/70">{formatPoints(h.totalPoints)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GoldBorder>
      ) : (
        !loading && (
          <Notice tone="info">
            No season is active. Create one below and activate it — or load the demo data to get a full 2026-2027 season instantly.
          </Notice>
        )
      )}

      <AdminSection title="Setup" description="Found the houses for a new project, or load sample data to explore the app.">
        <div className="flex flex-wrap gap-2">
          {missingHouses && (
            <button type="button" className="btn btn-gold btn-sm" disabled={!activeSeason || busySetup} onClick={foundHouses} title={!activeSeason ? 'Activate a season first' : undefined}>
              {busySetup && <Spinner size={12} />}
              Found the four houses
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPending({ kind: 'demo' })}>
            Load demo data
          </button>
        </div>
        {missingHouses && !activeSeason && <p className="mt-2 text-xs text-white/40">Activate a season before founding the houses.</p>}
      </AdminSection>

      <AdminSection title="Create a season">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="season-id">Season id</label>
            <input id="season-id" className="input" value={form.id} placeholder={suggested} onChange={(e) => setForm({ ...form, id: e.target.value.trim() })} />
            {!idValid && <p className="mt-1 text-xs text-red-300">Use the format YYYY-YYYY.</p>}
          </div>
          <div>
            <label className="label" htmlFor="season-name">Journey name</label>
            <input id="season-name" className="input" value={form.name} placeholder="e.g. LeaderQuest" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <p className="mt-1 text-xs text-white/40">Each year’s journey has its own name. The app stays CMII House Points.</p>
          </div>
          <div>
            <label className="label" htmlFor="season-start">Start date</label>
            <input id="season-start" type="date" required className="input" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="season-end">End date</label>
            <input id="season-end" type="date" required className="input" value={form.end} min={form.start} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-gold" disabled={creating || !idValid || !form.start || !form.end}>
              {creating && <Spinner size={14} />}
              Create season
            </button>
          </div>
        </form>
      </AdminSection>

      <AdminSection title="All seasons">
        {loading ? (
          <SkeletonRows rows={2} />
        ) : seasons.length === 0 ? (
          <EmptyState title="No seasons yet" />
        ) : (
          <ul className="space-y-2">
            {seasons.map((s) => {
              const champion = s.finalStandings?.[0];
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-royal/40 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeasonName season={s} />
                      <StatusBadge season={s} />
                    </div>
                    <p className="mt-0.5 text-xs text-white/45">
                      {s.id} · {formatDate(s.startDate)} – {formatDate(s.endDate)}
                    </p>
                  </div>
                  {champion && champion.totalPoints > 0 && (
                    <span className="flex items-center gap-1.5 text-xs text-white/60">
                      <Crown size={18} /> {HOUSES[champion.houseId]?.name} · {formatPoints(champion.totalPoints)}
                    </span>
                  )}
                  {s.status !== 'active' && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPending({ kind: 'activate', season: s })}>
                      Activate
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </AdminSection>

      <ConfirmDialog
        open={pending?.kind === 'activate'}
        title={`Activate ${pending?.kind === 'activate' ? seasonLabel(pending.season) : ''}?`}
        confirmLabel="Activate season"
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (pending?.kind !== 'activate') return;
          await activateSeason(pending.season.id);
          toast(`${seasonLabel(pending.season)} is now active.`, 'success');
        }}
      >
        <p>This closes the current season (saving its final standings), moves every house and member into this season, and resets totals to this season’s awards — zero if it’s new.</p>
        <p className="mt-2">Past awards stay in the audit log.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={pending?.kind === 'close'}
        title="Close the season?"
        confirmLabel="Close season"
        tone="danger"
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (pending?.kind !== 'close') return;
          await closeSeason(pending.season.id);
          toast('Season closed. The final standings are recorded.', 'success');
        }}
      >
        Faculty won’t be able to award points until another season is activated. The leaderboard will show these as the final standings.
      </ConfirmDialog>

      <ConfirmDialog
        open={pending?.kind === 'recompute'}
        title="Recalculate totals?"
        confirmLabel="Recalculate"
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (pending?.kind !== 'recompute') return;
          await recomputeSeasonTotals(pending.season.id);
          toast('Totals rebuilt from the award log.', 'success');
        }}
      >
        Rebuilds every house and student total from the points recorded this season. Use it if totals ever look out of sync.
      </ConfirmDialog>

      <ConfirmDialog
        open={pending?.kind === 'demo'}
        title="Load demo data?"
        confirmLabel="Load demo data"
        onClose={() => setPending(null)}
        onConfirm={async () => {
          const result = await loadDemoData(activeSeason);
          toast(`Demo data loaded into ${result.seasonId}: ${result.peopleCreated} people added, ${result.pointsWritten} awards.`, 'success');
        }}
      >
        <p>Adds 16 sorted students, 8 unsorted students for the sorting ceremony, 3 faculty advisors, and 10 awards{activeSeason ? ` to ${seasonLabel(activeSeason)}` : ', creating the LeaderQuest 2026-2027 season'}. Existing people aren’t changed, and running it twice won’t duplicate awards.</p>
        <p className="mt-2">These are roster records only — to sign in as the demo users, run the seed script instead.</p>
      </ConfirmDialog>
    </div>
  );
}
