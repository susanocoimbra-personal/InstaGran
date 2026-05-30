'use client';

import { useEffect, useState, useCallback } from 'react';
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

  const fetchPhotos = useCallback(async () => {
    let query = supabase
      .from('photos')
      .select('*, user:users!uploaded_by(*)')
      .order('created_at', { ascending: false });
    if (albumId) query = query.eq('album_id', albumId);

    const { data } = await query;
    if (data) setPhotos(data);
    setLoading(false);
  }, [albumId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return (
    <>
      <AppHeader title={`${albumEmoji} ${albumName}`} back />

      {loading ? (
        <div className="flex justify-center pt-32">
          <Spinner />
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center px-8 pt-24 text-center">
          <div
            className="mb-6 flex h-28 w-28 items-center justify-center rounded-full text-5xl"
            style={{ background: 'linear-gradient(135deg, #D9A899, #EDD4A0)' }}
          >
            {albumEmoji}
          </div>
          <h2 className="mb-1 text-xl font-extrabold text-ink">Ainda sem fotos</h2>
          <p className="text-base text-ink-secondary">Partilha o primeiro momento neste álbum</p>
        </div>
      ) : (
        <div className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white">
              {photos.length}
            </span>
            <span className="text-lg font-bold text-ink">
              {photos.length === 1 ? 'foto' : 'fotos'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => router.push(`/photo/${photo.id}`)}
                className="relative aspect-square overflow-hidden rounded-xl shadow-soft active:scale-95"
              >
                <PhotoImage
                  path={photo.image_url}
                  alt={photo.caption || 'Foto'}
                  className="absolute inset-0 h-full w-full"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
