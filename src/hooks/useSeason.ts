'use client';

import { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Season } from '../lib/types';

/** The single season with status "active", if any. */
export function useActiveSeason(): { season: Season | null; loading: boolean } {
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'seasons'), where('status', '==', 'active'), limit(1));
    return onSnapshot(
      q,
      (snap) => {
        const d = snap.docs[0];
        setSeason(d ? ({ id: d.id, ...d.data() } as Season) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  return { season, loading };
}

/** A single season by id (live). Seasons are publicly readable for the kiosk. */
export function useSeasonById(seasonId: string | null | undefined): Season | null {
  const [state, setState] = useState<{ id: string; season: Season | null } | null>(null);

  useEffect(() => {
    if (!seasonId) return;
    return onSnapshot(
      doc(db, 'seasons', seasonId),
      (snap) => setState({ id: seasonId, season: snap.exists() ? ({ id: snap.id, ...snap.data() } as Season) : null }),
      () => setState({ id: seasonId, season: null }),
    );
  }, [seasonId]);

  return seasonId && state?.id === seasonId ? state.season : null;
}

/** All seasons, newest first (admin). */
export function useSeasons(): { seasons: Season[]; loading: boolean } {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(
      collection(db, 'seasons'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Season);
        list.sort((a, b) => b.id.localeCompare(a.id));
        setSeasons(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  return { seasons, loading };
}
