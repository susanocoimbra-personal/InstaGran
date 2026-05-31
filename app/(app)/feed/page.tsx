'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePhotos } from '@/hooks/usePhotos';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/AppHeader';
import Spinner from '@/components/Spinner';
import PhotoImage from '@/components/PhotoImage';
import { formatPlateDate } from '@/lib/format';
import type { Photo } from '@/types/database';

// A single plate in the diary: gallery label, framed print, italic caption,
// quiet actions. The photograph carries all the colour; the chrome stays out.
function Plate({
  photo,
  plateNo,
  onOpen,
  index,
}: {
  photo: Photo;
  plateNo: string;
  onOpen: () => void;
  index: number;
}) {
  const reactionCount = (photo.reactions || []).length;
  const commentsCount = photo.comments_count ?? 0;

  // Clamp aspect ratio between 1:1 and 4:5 (portrait) so the column stays calm.
  const ratio =
    photo.width && photo.height && photo.width > 0
      ? Math.min(5 / 4, Math.max(1, photo.height / photo.width))
      : 4 / 5 < 1
        ? 1
        : 4 / 5;

  return (
    <figure
      className="mb-14 animate-rise-in"
      style={{ animationDelay: `${Math.min(index, 6) * 90}ms` }}
    >
      {/* Gallery label: plate number — author · date */}
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="label text-ink-muted">
          {plateNo} — {photo.user?.name || 'Família'}
        </span>
        <span className="label text-ink-muted">{formatPlateDate(photo.created_at)}</span>
      </div>

      {/* The print */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver foto de ${photo.user?.name || 'Família'}${photo.caption ? `, ${photo.caption}` : ''}`}
        className="block w-full overflow-hidden bg-paper-dim shadow-print transition active:scale-[0.995]"
        style={{ aspectRatio: `1 / ${ratio}` }}
      >
        <PhotoImage
          path={photo.image_url}
          alt={photo.caption || 'Fotografia de família'}
          width={900}
          className="h-full w-full"
        />
      </button>

      {/* Caption as exhibition text */}
      {photo.caption && (
        <figcaption className="mx-auto mt-4 max-w-[34ch] text-center font-serif text-[20px] italic leading-snug text-ink">
          “{photo.caption}”
        </figcaption>
      )}

      {/* Quiet actions */}
      <div className="mt-3 flex items-center justify-center gap-5 text-ink-muted">
        <span className="label flex items-center gap-1.5">
          <span aria-hidden>♥</span> {reactionCount}
        </span>
        <span className="h-3 w-px bg-line" />
        <button type="button" onClick={onOpen} className="label">
          {commentsCount === 1 ? '1 comentário' : `${commentsCount} comentários`}
        </button>
      </div>
    </figure>
  );
}

function EmptyState({ isParent }: { isParent: boolean }) {
  return (
    <div className="flex flex-col items-center px-8 pt-28 text-center">
      <p className="font-serif text-[26px] italic leading-tight text-ink">
        O diário ainda está em branco.
      </p>
      <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-ink-muted">
        {isParent
          ? 'Adiciona a primeira fotografia para começar a história.'
          : 'As fotografias vão aparecer aqui assim que forem partilhadas.'}
      </p>
    </div>
  );
}

export default function FeedPage() {
  const { photos, loading, refreshing, error, refresh } = usePhotos();
  const { user } = useAuth();
  const router = useRouter();

  // Newest photo gets the highest plate number, like a growing diary.
  const total = photos.length;
  const plate = useMemo(
    () => (i: number) => String(total - i).padStart(2, '0'),
    [total],
  );

  return (
    <>
      <AppHeader title="Vovo" brand subtitle="O diário da família" />

      <div className="mx-auto max-w-[440px] px-6">
        <div className="flex items-center justify-end pt-4">
          <button
            type="button"
            onClick={refresh}
            aria-label="Atualizar"
            className="label flex min-h-[44px] items-center gap-2 text-ink-muted active:text-ink"
          >
            <span className={refreshing ? 'inline-block animate-spin' : 'inline-block'}>↻</span>
            Atualizar
          </button>
        </div>

        {error && !loading && (
          <p className="mb-4 border border-danger/30 bg-danger/5 px-4 py-3 text-center text-[15px] text-ink">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center pt-28">
            <Spinner />
          </div>
        ) : photos.length === 0 && !error ? (
          <EmptyState isParent={user?.role === 'parent'} />
        ) : (
          <div className="pt-6">
            {photos.map((photo, i) => (
              <Plate
                key={photo.id}
                photo={photo}
                plateNo={plate(i)}
                index={i}
                onOpen={() => router.push(`/photo/${photo.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
