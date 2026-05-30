'use client';

import { useState } from 'react';
import { publicPhotoUrl } from '@/lib/supabase';

interface PhotoImageProps {
  path: string;
  alt: string;
  className?: string;
  /** object-fit; defaults to cover. */
  fit?: 'cover' | 'contain';
}

// Plain <img> against Supabase public Storage URLs, with a soft fade-in and a
// neutral placeholder background. We avoid next/image here because Storage
// already serves optimized originals and we want zero config friction.
export default function PhotoImage({ path, alt, className = '', fit = 'cover' }: PhotoImageProps) {
  const [loaded, setLoaded] = useState(false);
  const url = publicPhotoUrl(path);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      className={`${fit === 'cover' ? 'object-cover' : 'object-contain'} bg-surface-alt transition-opacity duration-300 ${
        loaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    />
  );
}
