'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/utils';

/**
 * FLIP reordering: when `orderKey` changes, elements registered with `register(key)`
 * glide from their previous position to the new one.
 */
export function useFlip<T extends HTMLElement>(orderKey: string, duration = 800) {
  const nodes = useRef(new Map<string, T>());
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const lastKey = useRef(orderKey);

  useLayoutEffect(() => {
    const changed = lastKey.current !== orderKey;
    lastKey.current = orderKey;
    nodes.current.forEach((el, key) => {
      const next = { x: el.offsetLeft, y: el.offsetTop };
      const prev = positions.current.get(key);
      if (changed && prev && !prefersReducedMotion()) {
        const dx = prev.x - next.x;
        const dy = prev.y - next.y;
        if (dx || dy) {
          el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], {
            duration,
            easing: 'cubic-bezier(0.22, 0.9, 0.24, 1)',
          });
        }
      }
      positions.current.set(key, next);
    });
  });

  return useCallback((key: string) => (el: T | null) => {
    if (el) nodes.current.set(key, el);
    else nodes.current.delete(key);
  }, []);
}
