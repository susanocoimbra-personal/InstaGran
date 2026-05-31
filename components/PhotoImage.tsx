'use client';

import { useState } from 'react';
import { publicPhotoUrl } from '@/lib/supabase';

interface PhotoImageProps {
  path: string;
  alt: string;
  className?: string;
  /** object-fit; defaults to cover. */
  fit?: 'cover' | 'contain';
  /** Supabase Storage transform width — keeps feed/grid light. Omit for full-res. */
  width?: number;
}

// Plain <img> against Supabase public Storage URLs, with a soft fade-in, a
// neutral placeholder, and a visible fallback when an image fails to load
// (e.g. it was deleted). We avoid next/image to keep config friction at zero;
// Storage's transform param gives us right-sized images instead.
export default function PhotoImage({ path, alt, className = '', fit = 'cover', width }: PhotoImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  // Start with the width-transformed URL when asked; on first error fall back
  // to the untransformed original (some Storage tiers don't serve transforms),
  // and only show the error state if that fails too.
  const base = publicPhotoUrl(path);
  const [src, setSrc] = useState(width ? `${base}?width=${width}&quality=75` : base);
  const usingTransform = src !== base;

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 bg-paper-dim text-center text-ink-muted ${className}`}
      >
        <span className="text-2xl" aria-hidden>
          🖼️
        </span>
        <span className="px-2 text-sm">Não foi possível carregar a foto</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (usingTransform) {
          setSrc(base); // retry with the original, untransformed URL
        } else {
          setFailed(true);
        }
      }}
      className={`${fit === 'cover' ? 'object-cover' : 'object-contain'} bg-paper-dim transition-opacity duration-500 ${
        loaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    />
  );
}
