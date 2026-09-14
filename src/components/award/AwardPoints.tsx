'use client';

import { useCallback, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { useSearchParam } from '../../hooks/useSearchParam';
import { useAuth } from '../../hooks/useAuth';
import { awardPoints } from '../../hooks/usePoints';
import { useActiveSeason } from '../../hooks/useSeason';
import { useStudents } from '../../hooks/useStudents';
import { CATEGORIES, HOUSES, isHouseId, NOTE_MAX_LENGTH, type CategoryKey } from '../../lib/constants';
import type { AppUser } from '../../lib/types';
import { clamp, cn, lighten, rgba, seasonLabel } from '../../lib/utils';
import { AnimatedNumber } from '../shared/AnimatedNumber';
import { Avatar } from '../shared/Avatar';
import { GoldBorder } from '../shared/GoldBorder';
import { HouseBadge } from '../shared/HouseBadge';
import { PageHeader } from '../shared/PageHeader';
import { Shield } from '../shared/Shield';
import { Notice, Spinner } from '../shared/States';
import { useToast } from '../shared/Toast';
import { AwardConfirm, type AwardCelebration } from './AwardConfirm';
import { CategoryPicker } from './CategoryPicker';
import { StudentSearch } from './StudentSearch';

function SectionLabel({ step, children }: { step: number; children: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-6 w-6 rotate-45 items-center justify-center border border-gold/70 bg-royal">
        <span className="-rotate-45 font-heading text-[11px] font-bold text-gold-light">{step}</span>
      </span>
      <h2 className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-white/85">{children}</h2>
    </div>
  );
}

function SelectedStudent({ student, onChange }: { student: AppUser; onChange: () => void }) {
  const house = isHouseId(student.houseId) ? HOUSES[student.houseId] : null;
  return (
    <GoldBorder glow={house?.color} className="flex items-center gap-3.5 p-4">
      {house && <Shield houseId={house.id} size={46} glow className="shrink-0" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Avatar name={student.displayName} houseId={student.houseId} size={26} />
          <p className="truncate text-lg font-semibold">{student.displayName}</p>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <HouseBadge houseId={student.houseId} size="xs" />
          <span className="text-xs text-white/50">
            Current total <AnimatedNumber value={student.totalPoints} className="scoreboard ml-0.5 text-sm text-white" />
          </span>
        </div>
      </div>
      <button type="button" onClick={onChange} className="btn-text shrink-0">
        Change
      </button>
    </GoldBorder>
  );
}

export function AwardPoints() {
  const { profile } = useAuth();
  const toast = useToast();
  const { season, loading: seasonLoading } = useActiveSeason();
  // Only sorted students can earn points — they need a house to share them with.
  const { sorted: students, loading: studentsLoading } = useStudents(seasonLoading ? null : season?.id ?? null);
  const [selectedId, setSelectedId] = useSearchParam('student');
  const student = useMemo(() => students.find((s) => s.id === selectedId) ?? null, [students, selectedId]);

  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<AwardCelebration | null>(null);

  const cat = category ? CATEGORIES[category] : null;
  const amount = Number(amountText);
  const amountValid = !!cat && Number.isInteger(amount) && amount >= cat.min && amount <= cat.max;
  const canSubmit = !!student && !!season && amountValid && !submitting;

  const selectStudent = (s: AppUser | null) => {
    setError(null);
    // Selecting pushes history so the phone's back button returns to the student list.
    setSelectedId(s ? s.id : null, { push: !!s });
    if (s) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const chooseCategory = (key: CategoryKey) => {
    setCategory(key);
    setAmountText(String(CATEGORIES[key].min));
    setError(null);
  };

  const nudge = (dir: 1 | -1) => {
    if (!cat) return;
    const base = Number.isFinite(amount) && amountText !== '' ? amount : cat.min;
    setAmountText(String(clamp(base + dir * cat.step, cat.min, cat.max)));
  };

  const reset = useCallback(() => {
    setCelebration(null);
    setCategory(null);
    setAmountText('');
    setNote('');
    setSelectedId(null);
  }, [setSelectedId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !student || !season || !profile || !category) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await awardPoints({ studentId: student.id, category, amount, note, seasonId: season.id, awardedBy: profile });
      setCelebration({ studentName: student.displayName, houseId: result.houseId, category, amount, houseTotal: result.houseTotal });
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const color = cat?.color ?? '#D4A843';
  const pct = cat ? ((clamp(amount || cat.min, cat.min, cat.max) - cat.min) / (cat.max - cat.min)) * 100 : 0;
  const firstName = student?.displayName.split(' ')[0] ?? '';

  return (
    <div>
      <PageHeader eyebrow={season ? seasonLabel(season) : 'Faculty'} title="Award Points" subtitle="Recognize a student and add to their house’s tally." />

      {!seasonLoading && !season && (
        <Notice tone="error" className="mb-5">
          There’s no active season, so points can’t be awarded. An admin can activate one from the Admin panel.
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Step 1 — student */}
        <section className={cn(student && 'hidden md:block')}>
          <SectionLabel step={1}>Choose a student</SectionLabel>
          <StudentSearch students={students} loading={studentsLoading || seasonLoading} onSelect={selectStudent} />
        </section>

        {/* Steps 2-4 — the award */}
        <section className={cn(!student && 'hidden md:block')}>
          {!student ? (
            <div className="lq-card-flat flex h-full min-h-[320px] flex-col items-center justify-center p-8 text-center">
              <div className="flex -space-x-3 opacity-60">
                {(['lumina', 'doron', 'ase', 'kaizen'] as const).map((id) => (
                  <Shield key={id} houseId={id} size={40} />
                ))}
              </div>
              <p className="mt-4 font-heading text-base font-semibold text-gold-light">Choose a student to begin</p>
              <p className="mt-1 text-sm text-white/45">Their house will share in every point you award.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6 animate-fade-up">
              <div className="md:hidden">
                <SectionLabel step={1}>Student</SectionLabel>
              </div>
              <SelectedStudent student={student} onChange={() => selectStudent(null)} />

              <div>
                <SectionLabel step={2}>Category</SectionLabel>
                <CategoryPicker value={category} onChange={chooseCategory} />
              </div>

              {cat && (
                <div className="animate-fade-up">
                  <SectionLabel step={3}>Points</SectionLabel>
                  <div className="lq-card p-4" style={{ borderColor: rgba(color, 0.45) }}>
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => nudge(-1)}
                        disabled={amount <= cat.min}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-2xl font-light transition hover:border-white/30 disabled:opacity-30"
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <div className="flex min-w-0 flex-col items-center">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={amountText}
                          min={cat.min}
                          max={cat.max}
                          step={1}
                          onChange={(e) => setAmountText(e.target.value.replace(/[^\d]/g, ''))}
                          onBlur={() => setAmountText(String(clamp(Math.round(amount) || cat.min, cat.min, cat.max)))}
                          className="scoreboard w-32 bg-transparent text-center text-5xl leading-none focus:outline-none"
                          style={{ color: lighten(color, 0.25), textShadow: `0 0 22px ${rgba(color, 0.55)}` }}
                          aria-label="Point amount"
                        />
                        <span className="mt-1 font-heading text-[10px] uppercase tracking-[0.2em] text-white/45">
                          {cat.min}–{cat.max} points
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => nudge(1)}
                        disabled={amount >= cat.max}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-2xl font-light transition hover:border-white/30 disabled:opacity-30"
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>

                    <input
                      type="range"
                      min={cat.min}
                      max={cat.max}
                      step={cat.step === 25 ? 5 : 1}
                      value={clamp(amount || cat.min, cat.min, cat.max)}
                      onChange={(e) => setAmountText(e.target.value)}
                      className="range mt-5 w-full"
                      style={{ '--range': color, '--fill': `${pct}%` } as CSSProperties}
                      aria-label="Point amount slider"
                    />

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[cat.min, Math.round((cat.min + cat.max) / 2 / cat.step) * cat.step, cat.max].map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAmountText(String(preset))}
                          className="rounded-md border py-1.5 text-sm font-bold transition scoreboard"
                          style={
                            amount === preset
                              ? { borderColor: color, background: rgba(color, 0.2), color: lighten(color, 0.35) }
                              : { borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }
                          }
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    {!amountValid && amountText !== '' && (
                      <p className="mt-3 text-center text-xs text-red-300">
                        Enter a whole number from {cat.min} to {cat.max}.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {cat && (
                <div className="animate-fade-up">
                  <SectionLabel step={4}>Note (optional)</SectionLabel>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_LENGTH))}
                    rows={2}
                    placeholder="What did they do? e.g. Led the team through the final edit."
                    className="input resize-none"
                  />
                  <p className="mt-1 text-right text-[11px] text-white/35">
                    {note.length}/{NOTE_MAX_LENGTH}
                  </p>
                </div>
              )}

              {error && <Notice tone="error">{error}</Notice>}

              <div className="sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-10 -mx-4 bg-gradient-to-t from-royal-night via-royal-night/90 to-transparent px-4 pb-1 pt-4 md:static md:mx-0 md:bg-none md:p-0">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn btn-color w-full py-4 text-base"
                  style={{ '--btn': color } as CSSProperties}
                >
                  {submitting && <Spinner size={16} className="border-black/20 border-t-black/80" />}
                  {cat ? `Award +${amountValid ? amount : '…'} to ${firstName}` : 'Choose a category'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {celebration && <AwardConfirm award={celebration} onDone={reset} />}
    </div>
  );
}
