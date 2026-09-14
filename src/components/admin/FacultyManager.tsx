'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFaculty } from '../../hooks/useStudents';
import { addUser, removeUser, setAdvisorHouse, setUserRole } from '../../lib/adminActions';
import { HOUSES, HOUSE_IDS, isHouseId, type HouseId, type Role } from '../../lib/constants';
import type { AppUser, Season } from '../../lib/types';
import { isGsuEmail } from '../../lib/utils';
import { Avatar } from '../shared/Avatar';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { EmptyState, Notice, SkeletonRows, Spinner } from '../shared/States';
import { useToast } from '../shared/Toast';
import { AdminSection } from './AdminSection';

export function FacultyManager({ activeSeason }: { activeSeason: Season | null }) {
  const { profile } = useAuth();
  const toast = useToast();
  const { users: faculty, loading } = useFaculty();
  const [form, setForm] = useState({ name: '', email: '', role: 'faculty' as Role, house: '' as HouseId | '' });
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<AppUser | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await addUser(
        { email: form.email, displayName: form.name, role: form.role, houseId: isHouseId(form.house) ? form.house : null },
        activeSeason?.id ?? '',
      );
      toast(`${form.name} was added as ${form.role === 'admin' ? 'an admin' : 'faculty'}.`, 'success');
      setForm({ name: '', email: '', role: 'faculty', house: '' });
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setAdding(false);
    }
  };

  const save = async (user: AppUser, fn: () => Promise<void>, message: string) => {
    setSavingId(user.id);
    try {
      await fn();
      toast(message, 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <AdminSection title="Add faculty" description="Faculty can award points and view rosters. Admins can also manage seasons, people, and the audit log.">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_130px_150px_auto] lg:items-end">
          <div>
            <label className="label" htmlFor="fac-name">Name</label>
            <input id="fac-name" className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Jane Doe" />
          </div>
          <div>
            <label className="label" htmlFor="fac-email">GSU email</label>
            <input id="fac-email" type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jdoe@gsu.edu" />
          </div>
          <div>
            <label className="label" htmlFor="fac-role">Role</label>
            <select id="fac-role" className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="fac-house">House advisor</label>
            <select id="fac-house" className="input" value={form.house} onChange={(e) => setForm({ ...form, house: e.target.value as HouseId | '' })}>
              <option value="">None</option>
              {HOUSE_IDS.map((id) => (
                <option key={id} value={id}>
                  {HOUSES[id].name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-gold" disabled={adding || !form.name.trim() || !isGsuEmail(form.email)}>
            {adding && <Spinner size={14} />}
            Add
          </button>
        </form>
        {form.email && !isGsuEmail(form.email) && <Notice tone="error" className="mt-3">Faculty must use a GSU email to sign in.</Notice>}
      </AdminSection>

      <AdminSection title={`Faculty & admins (${faculty.length})`}>
        {loading ? (
          <SkeletonRows rows={3} />
        ) : faculty.length === 0 ? (
          <EmptyState title="No faculty yet" />
        ) : (
          <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-lg border border-white/10">
            {faculty.map((f) => {
              const isMe = f.id === profile?.id;
              return (
                <li key={f.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                  <Avatar name={f.displayName} houseId={f.houseId} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {f.displayName} {isMe && <span className="text-xs font-normal text-white/40">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-white/40">{f.email}</p>
                  </div>
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <select
                      className="input w-auto flex-1 py-1.5 text-sm sm:flex-none"
                      value={f.role}
                      disabled={isMe || savingId === f.id}
                      title={isMe ? 'You can’t change your own role' : undefined}
                      onChange={(e) => save(f, () => setUserRole(f, e.target.value as Role), `${f.displayName} is now ${e.target.value}.`)}
                      aria-label="Role"
                    >
                      <option value="faculty">Faculty</option>
                      <option value="admin">Admin</option>
                    </select>
                    <select
                      className="input w-auto flex-1 py-1.5 text-sm sm:flex-none"
                      value={f.houseId ?? ''}
                      disabled={savingId === f.id}
                      onChange={(e) => {
                        const next = isHouseId(e.target.value) ? e.target.value : null;
                        save(f, () => setAdvisorHouse(f, next), next ? `${f.displayName} now advises ${HOUSES[next].name}.` : `${f.displayName} no longer advises a house.`);
                      }}
                      aria-label="House advisor"
                    >
                      <option value="">No house</option>
                      {HOUSE_IDS.map((id) => (
                        <option key={id} value={id}>
                          Advises {HOUSES[id].name}
                        </option>
                      ))}
                    </select>
                    {savingId === f.id ? (
                      <Spinner size={16} />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRemoving(f)}
                        disabled={isMe}
                        className="rounded p-1 text-white/35 transition hover:text-red-300 disabled:opacity-20"
                        aria-label={`Remove ${f.displayName}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminSection>

      <ConfirmDialog
        open={!!removing}
        title="Remove faculty member?"
        tone="danger"
        confirmLabel="Remove"
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (!removing) return;
          await removeUser(removing);
          toast(`${removing.displayName} was removed.`, 'success');
        }}
      >
        {removing?.displayName} will lose access to CMII House Points. Points they already awarded stay in the log.
      </ConfirmDialog>
    </div>
  );
}
