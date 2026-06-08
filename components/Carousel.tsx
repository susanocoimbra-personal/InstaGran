'use client';

import { useRef, useState } from 'react';
import PhotoImage from '@/components/PhotoImage';
import type { Photo } from '@/types/database';

interface CarouselProps {
  photos: Photo[];
  /** aspect ratio (height / width) for the frame. */
  ratio: number;
  /** Storage transform width for each slide. */
  width?: number;
  /** Tapping a slide (e.g. to open the detail view). */
  onSelect?: () => void;
  altPrefix?: string;
}

// Horizontal scroll-snap carousel — native, smooth, no dependency. Shows a
// slide counter (1/5) and dots. A single photo renders as a plain frame.
export default function Carousel({
  photos,
  ratio,
  width = 900,
  onSelect,
  altPrefix = 'Fotografia',
}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(i, photos.length - 1));
    const left = clamped * el.clientWidth;
    // Update the indicator immediately (don't wait for the scroll event), then
    // animate. Fall back to an instant jump if smooth scrolling is unsupported.
    setIndex(clamped);
    try {
      el.scrollTo({ left, behavior: 'smooth' });
    } catch {
      el.scrollLeft = left;
    }
  };

  const atStart = index === 0;
  const atEnd = index === photos.length - 1;

  if (photos.length === 1) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-label={altPrefix}
        className="block w-full overflow-hidden bg-paper-dim shadow-print transition active:scale-[0.995]"
        style={{ aspectRatio: `1 / ${ratio}` }}
      >
        <PhotoImage path={photos[0].image_url} alt={altPrefix} width={width} className="h-full w-full" />
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Counter, top-right over the frame */}
      <div className="label pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-ink/70 px-2.5 py-1 text-paper backdrop-blur">
        {index + 1}/{photos.length}
      </div>

      {/* Prev / next arrows (Instagram-style). stopPropagation so tapping an
          arrow navigates instead of opening the detail view. Hidden at the ends. */}
      {!atStart && (
        <button
          type="button"
          aria-label="Foto anterior"
          onClick={(e) => {
            e.stopPropagation();
            goTo(index - 1);
          }}
          className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-paper/80 text-xl leading-none text-ink shadow-print backdrop-blur transition active:scale-90"
        >
          ‹
        </button>
      )}
      {!atEnd && (
        <button
          type="button"
          aria-label="Foto seguinte"
          onClick={(e) => {
            e.stopPropagation();
            goTo(index + 1);
          }}
          className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-paper/80 text-xl leading-none text-ink shadow-print backdrop-blur transition active:scale-90"
        >
          ›
        </button>
      )}

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto shadow-print"
        style={{ aspectRatio: `1 / ${ratio}`, scrollbarWidth: 'none' }}
      >
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={onSelect}
            aria-label={`${altPrefix} ${i + 1} de ${photos.length}`}
            className="relative w-full shrink-0 snap-center bg-paper-dim"
          >
            <PhotoImage
              path={p.image_url}
              alt={`${altPrefix} ${i + 1}`}
              width={width}
              className="absolute inset-0 h-full w-full"
            />
          </button>
        ))}
      </div>

      {/* Dots */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ir para a foto ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-5 bg-ink' : 'w-1.5 bg-line'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
