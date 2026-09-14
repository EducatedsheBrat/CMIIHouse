'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { HOUSES, isHouseId } from '../lib/constants';
import type { House, RankedHouse } from '../lib/types';
import { rankHouses } from '../lib/utils';

interface HousesState {
  houses: RankedHouse[];
  loading: boolean;
  error: string | null;
  /** True when the data came from the offline cache rather than the server. */
  fromCache: boolean;
}

/** Real-time house standings, ranked by total points. */
export function useHouses(): HousesState {
  const [raw, setRaw] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    return onSnapshot(
      collection(db, 'houses'),
      { includeMetadataChanges: true },
      (snap) => {
        const list: House[] = [];
        snap.forEach((d) => {
          if (!isHouseId(d.id)) return;
          const data = d.data();
          const meta = HOUSES[d.id];
          list.push({
            id: d.id,
            name: data.name ?? meta.name,
            motto: data.motto ?? meta.motto,
            description: data.description ?? meta.description,
            color: data.color ?? meta.color,
            totalPoints: typeof data.totalPoints === 'number' ? data.totalPoints : 0,
            seasonId: data.seasonId ?? '',
            advisors: Array.isArray(data.advisors) ? data.advisors : [],
            lastPointId: data.lastPointId,
          });
        });
        setRaw(list);
        setFromCache(snap.metadata.fromCache);
        // An empty cache-only result on first load isn't authoritative yet.
        if (!(snap.metadata.fromCache && snap.empty)) setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, []);

  const houses = useMemo(() => rankHouses(raw), [raw]);
  return { houses, loading, error, fromCache };
}
