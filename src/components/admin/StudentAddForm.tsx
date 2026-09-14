'use client';

import { useRef, useState, type FormEvent } from 'react';
import { addStudent } from '../../lib/adminActions';
import type { Season } from '../../lib/types';
import { isGsuEmail } from '../../lib/utils';
import { Avatar } from '../shared/Avatar';
import { Spinner } from '../shared/States';
import { useToast } from '../shared/Toast';
import { AdminSection } from './AdminSection';

/** Manual add, one student at a time. The form stays put so you can keep adding. */
export function StudentAddForm({ activeSeason }: { activeSeason: Season | null }) {
  const toast = useToast();
  const nameInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<Array<{ name: string; email: string }>>([]);

  const valid = name.trim().length > 0 && isGsuEmail(email);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeSeason || !valid) return;
    setBusy(true);
    try {
      await addStudent(name, email, activeSeason.id);
      setAdded((a) => [{ name: name.trim(), email: email.trim().toLowerCase() }, ...a].slice(0, 6));
      setName('');
      setEmail('');
      nameInput.current?.focus();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminSection title="Add a student" description="They’ll join the unsorted queue for the next ceremony.">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label" htmlFor="add-name">Name</label>
          <input id="add-name" ref={nameInput} className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="off" />
        </div>
        <div>
          <label className="label" htmlFor="add-email">GSU email</label>
          <input id="add-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@student.gsu.edu" autoComplete="off" />
          {email && !isGsuEmail(email) && <p className="mt-1 text-xs text-red-300">Students need a GSU email to sign in.</p>}
        </div>
        <button type="submit" className="btn btn-gold w-full" disabled={!activeSeason || !valid || busy}>
          {busy && <Spinner size={14} />}
          {added.length ? 'Add another' : 'Add student'}
        </button>
      </form>

      {added.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 font-heading text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Just added</p>
          <ul className="space-y-1">
            {added.map((s) => (
              <li key={s.email} className="flex items-center gap-2 rounded-md bg-white/[0.03] px-2 py-1.5 text-sm animate-fade-up">
                <Avatar name={s.name} size={24} />
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                <span className="text-[11px] text-emerald-300">✓ unsorted</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AdminSection>
  );
}
