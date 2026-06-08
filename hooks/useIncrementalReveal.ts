'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Reveal a long list incrementally as the user scrolls, so we only mount (and
// thus only let the browser fetch) the rows near the viewport. Data is already
// in memory; this just gates how many rows render at once.
//
// We use an IntersectionObserver on a sentinel AND a scroll/resize fallback,
// because some environments (headless renderers, zero-height viewports) don't
// fire the observer reliably. Either path reveals the next page.
export function useIncrementalReveal<T>(items: T[], pageSize = 4) {
  const [count, setCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const total = items.length;
  const hasMore = count < total;

  // Clamp/grow when the list size changes (e.g. refresh).
  useEffect(() => {
    setCount((c) => Math.min(Math.max(c, pageSize), Math.max(total, pageSize)));
  }, [total, pageSize]);

  const revealMore = useCallback(() => {
    setCount((c) => (c < total ? c + pageSize : c));
  }, [total, pageSize]);

  // Reveal when the sentinel is near the viewport — via observer, plus a
  // scroll/resize fallback that checks the sentinel's position directly.
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) revealMore();
        },
        { rootMargin: '800px 0px' },
      );
      io.observe(el);
    }

    const check = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      // Within 800px of the viewport bottom (or viewport unknown → reveal).
      if (vh === 0 || rect.top <= vh + 800) revealMore();
    };
    check(); // run once on mount in case the sentinel starts in view
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);

    return () => {
      io?.disconnect();
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [hasMore, revealMore, count]);

  return { visible: items.slice(0, count), hasMore, sentinelRef };
}
