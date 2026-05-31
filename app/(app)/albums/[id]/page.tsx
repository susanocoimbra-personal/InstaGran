'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AppHeader from '@/components/AppHeader';
import Spinner from '@/components/Spinner';
import PhotoImage from '@/components/PhotoImage';
import type { Photo } from '@/types/database';

export default function AlbumPhotosPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const albumId = params.id === 'all' ? null : params.id;
  const albumName = searchParams.get('name') || 'Álbum';
  const albumEmoji = searchParams.get('emoji') || '📁';

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchPhotos() {
      let query = supabase
        .from('photos')
        .select('*, user:users!uploaded_by(*)')
        .order('created_at', { ascending: false });
      if (albumId) query = query.eq('album_id', albumId);

      const { data, error: queryError } = await query;
      if (!active) return;
      if (queryError) setError('Não foi possível carregar o álbum. Tenta outra vez.');
      else if (data) setPhotos(data);
      setLoading(false);
    }

    fetchPhotos();
    return () => {
      active = false;
    };
  }, [albumId]);

  return (
    <>
      {/* Album masthead: emoji + serif title + count */}
      <header
        style={{ ['--safe-pad-top' as string]: '24px' }}
        className="border-b border-line bg-paper px-6 pb-5 pt-6 safe-top"
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="label -ml-1 mb-3 flex min-h-[44px] items-center text-ink-muted active:text-ink"
        >
          ‹ Álbuns
        </button>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl">{albumEmoji}</span>
          <h1 className="font-serif text-[34px] leading-none tracking-wordmark text-ink">{albumName}</h1>
        </div>
        {!loading && !error && (
          <p className="label mt-2 text-ink-muted">
            {photos.length} {photos.length === 1 ? 'fotografia' : 'fotografias'}
          </p>
        )}
      </header>

      <div className="mx-auto max-w-[440px] px-6">
        {loading ? (
          <div className="flex justify-center pt-28">
            <Spinner />
          </div>
        ) : error ? (
          <p className="mt-6 text-center text-[15px] text-ink-muted">{error}</p>
        ) : photos.length === 0 ? (
          <p className="px-2 pt-16 text-center font-serif text-[20px] italic leading-snug text-ink-muted">
            Ainda sem fotografias neste álbum.
          </p>
        ) : (
          // A tighter editorial grid: thin gutters, prints flush like a contact sheet.
          <div className="grid grid-cols-2 gap-3 pt-6">
            {photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => router.push(`/photo/${photo.id}`)}
                className="relative aspect-[4/5] overflow-hidden bg-paper-dim shadow-print transition active:scale-[0.98]"
              >
                <PhotoImage
                  path={photo.image_url}
                  alt={photo.caption || 'Fotografia'}
                  width={500}
                  className="absolute inset-0 h-full w-full"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
