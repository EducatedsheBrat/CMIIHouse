'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import '../../styles/ceremony.css';
import { useActiveSeason } from '../../hooks/useSeason';
import { useStudents } from '../../hooks/useStudents';
import { useSorting, type CeremonyStage } from '../../hooks/useSorting';
import { HOUSES, HOUSE_IDS } from '../../lib/constants';
import { cn, lighten, rgba, seasonLabel } from '../../lib/utils';
import { OrnamentalDivider } from '../shared/OrnamentalDivider';
import { PageHeader } from '../shared/PageHeader';
import { Panther } from '../shared/Panther';
import { Notice, SkeletonRows } from '../shared/States';
import { useToast } from '../shared/Toast';
import { HouseReveal } from './HouseReveal';
import { PantherRunner, type PantherRunnerHandle } from './PantherRunner';
import { SortingWheel, type SortingWheelHandle } from './SortingWheel';
import { SortLog } from './SortLog';
import { UnsortedQueue } from './UnsortedQueue';

function AllSorted({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="flex w-full flex-col items-center py-6 text-center animate-fade-up">
      <p className="eyebrow">The Sorting is complete</p>
      <h2 className="mt-2 font-display text-3xl font-black text-gold-gradient sm:text-4xl">All students sorted</h2>
      <OrnamentalDivider className="my-6 w-full max-w-md" />
      <div className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        {HOUSE_IDS.map((id) => {
          const house = HOUSES[id];
          return (
            <div key={id} className="lq-card flex flex-col items-center px-3 pb-4 pt-3" style={{ borderColor: rgba(house.color, 0.5), boxShadow: `0 0 24px -12px ${house.color}` }}>
              <Panther house={id} glow className="w-full max-w-[140px]" />
              <p className="mt-2 font-display text-lg font-bold" style={{ color: lighten(house.color, 0.2) }}>
                {house.name}
              </p>
              <p className="scoreboard text-3xl">{counts[id] ?? 0}</p>
              <p className="font-heading text-[10px] uppercase tracking-[0.2em] text-white/45">members</p>
            </div>
          );
        })}
      </div>
      <Link href="/roster" className="btn btn-ghost mt-8">
        View house rosters
      </Link>
    </div>
  );
}

export function SortingCeremony() {
  const toast = useToast();
  const { season, loading: seasonLoading } = useActiveSeason();
  const { users: students, loading } = useStudents(seasonLoading ? null : season?.id ?? null);

  const root = useRef<HTMLDivElement>(null);
  const wheel = useRef<SortingWheelHandle>(null);
  const runner = useRef<PantherRunnerHandle>(null);
  const stageRef = useRef<CeremonyStage | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Hand the hook imperative control of the wheel and panther (both refs are stable, so once is enough).
  useEffect(() => {
    stageRef.current = {
      spin: () => {
        wheel.current?.spin();
        runner.current?.run();
      },
      stop: (houseId) => {
        runner.current?.stop();
        return wheel.current?.stop(houseId) ?? Promise.resolve();
      },
      reset: () => runner.current?.reset(),
    };
  }, []);

  const ceremony = useSorting(students, stageRef);
  const { phase, current, result, unsorted, counts, log, error } = ceremony;

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Space bar drives the ceremony for presenters with a clicker or keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || (e.target as HTMLElement).closest('input, textarea, select, button')) return;
      e.preventDefault();
      if (phase === 'idle') ceremony.spin();
      else if (phase === 'spinning') void ceremony.stop();
      else if (phase === 'reveal') ceremony.finishReveal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, ceremony]);

  const undo = async () => {
    const name = log[0]?.student.displayName;
    await ceremony.undoLast();
    if (name) toast(`${name} returned to the queue.`, 'info');
  };

  const togglePresent = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    else root.current?.requestFullscreen?.().catch(() => undefined);
  };

  const landed = phase === 'reveal' && result ? result.houseId : null;
  const allSorted = !loading && unsorted.length === 0 && phase === 'idle';
  const busy = phase !== 'idle';

  return (
    <div ref={root} className={cn('lq-ceremony', fullscreen && 'is-presenting')}>
      <PageHeader
        eyebrow={season ? seasonLabel(season) : 'Sorting Ceremony'}
        title="The Sorting Ceremony"
        subtitle={fullscreen ? undefined : 'Select a student, spin the wheel, and welcome them to their house.'}
        actions={
          <button type="button" onClick={togglePresent} className="btn btn-ghost btn-sm">
            {fullscreen ? 'Exit presentation' : 'Present'}
          </button>
        }
      />

      {!seasonLoading && !season && <Notice tone="error">There’s no active season. An admin needs to activate one before sorting.</Notice>}

      {loading || seasonLoading ? (
        <SkeletonRows rows={4} height={90} />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)_270px] lg:items-start">
          <div className="order-1">
            <UnsortedQueue students={unsorted} currentId={current?.id ?? null} disabled={busy} onSelect={ceremony.select} />
          </div>

          <section className="lq-stage order-2 flex min-w-0 flex-col items-center" aria-label="Sorting wheel">
            {allSorted ? (
              <AllSorted counts={counts} />
            ) : (
              <>
                <div className="mb-6 min-h-[4.5rem] text-center">
                  <p className="eyebrow">{phase === 'reveal' ? 'Sorted' : current ? 'Now sorting' : 'Choose a student'}</p>
                  <p key={current?.id} className="mt-1 font-display text-3xl font-black leading-tight text-white animate-fade-up sm:text-[42px]">
                    {current?.displayName ?? '—'}
                  </p>
                </div>

                <div className="relative flex justify-center">
                  <SortingWheel ref={wheel} landed={landed} className={cn('transition-opacity duration-700', landed && 'opacity-40')} />
                  {phase === 'reveal' && result && (
                    <HouseReveal houseId={result.houseId} studentName={result.student.displayName.split(' ')[0]} onDismiss={ceremony.finishReveal} />
                  )}
                </div>

                <PantherRunner ref={runner} reveal={landed} className="mt-2" />

                <div className="mt-4 flex h-14 items-center justify-center gap-3">
                  {phase === 'idle' && (
                    <button type="button" onClick={ceremony.spin} disabled={!current || !season} className="btn btn-gold px-12 py-3.5 text-base">
                      Spin
                    </button>
                  )}
                  {phase === 'spinning' && (
                    <button type="button" onClick={() => void ceremony.stop()} className="btn btn-color px-12 py-3.5 text-base" style={{ ['--btn' as string]: '#E8E2D0' }}>
                      Stop
                    </button>
                  )}
                  {phase === 'stopping' && <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-gold/80 animate-pulse">The wheel is deciding…</p>}
                  {phase === 'reveal' && (
                    <button type="button" onClick={ceremony.finishReveal} className="btn btn-ghost px-10 py-3">
                      {unsorted.length > 0 ? 'Next student' : 'Finish'}
                    </button>
                  )}
                </div>
                <p className="mt-1 hidden text-center text-[11px] text-white/35 sm:block">Tip: press the space bar to spin, stop, and continue.</p>
                {error && <Notice tone="error" className="mt-4 max-w-lg">{error}</Notice>}
              </>
            )}
          </section>

          <div className="order-3">
            <SortLog log={log} counts={counts} canUndo={phase === 'idle' && log.length > 0} onUndo={undo} />
          </div>
        </div>
      )}
    </div>
  );
}
