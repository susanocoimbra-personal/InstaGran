'use client';

import { useEffect, useRef, useState } from 'react';

// Pull-to-refresh for touch devices. When the page is scrolled to the very top
// and the user drags down past a threshold, fire onRefresh. Exposes `pull`
// (0..1+) so the UI can show a growing indicator, and `refreshing` while the
// async refresh runs.
export function usePullToRefresh(onRefresh: () => void | Promise<void>) {
  const [pull, setPull] = useState(0); // current pull distance, normalized 0..1
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);
  const THRESHOLD = 70; // px to trigger
  const MAX = 110; // px cap for the visual

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      // Only arm when at the very top and not already refreshing.
      if (refreshing) return;
      if (window.scrollY > 0) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
      active.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active.current || startY.current === null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        return;
      }
      // Resistance: the further you pull, the slower it grows.
      const eased = Math.min(MAX, dy * 0.5);
      setPull(eased / THRESHOLD);
    };

    const onTouchEnd = async () => {
      if (!active.current) return;
      active.current = false;
      const shouldRefresh = pull >= 1 && !refreshing;
      setPull(0);
      if (shouldRefresh) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
      startY.current = null;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, pull, refreshing]);

  return { pull, refreshing };
}
