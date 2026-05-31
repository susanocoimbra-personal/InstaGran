'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePhotos } from '@/hooks/usePhotos';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/AppHeader';
import Spinner from '@/components/Spinner';
import PhotoImage from '@/components/PhotoImage';
import { formatTimeAgo, pickAvatarBg } from '@/lib/format';
import type { Photo } from '@/types/database';

function PhotoCard({
  photo,
  onOpen,
  index,
}: {
  photo: Photo;
  onOpen: () => void;
  index: number;
}) {
  const reactionSummary = useMemo(
    () =>
      (photo.reactions || []).reduce((acc: Record<string, number>, r) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
      }, {}),
    [photo.reactions],
  );

  const reactionEntries = Object.entries(reactionSummary);
  const commentsCount = photo.comments_count ?? 0;
  const hasFooter = reactionEntries.length > 0 || commentsCount > 0;

  // Clamp aspect ratio between 1:1 and 3:4 (portrait) so the feed stays tidy.
  const ratio =
    photo.width && photo.height && photo.width > 0
      ? Math.min(4 / 3, Math.max(1, photo.height / photo.width))
      : 1;

  return (
    <button
      type="button"
      onClick={onOpen}
      // Staggered entrance, capped at 6 so a long feed never waits on choreography.
      className="mx-4 block animate-fade-up overflow-hidden rounded-2xl bg-surface text-left shadow-card transition active:scale-[0.99]"
      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
      aria-label={`Foto de ${photo.user?.name || 'Família'}${photo.caption ? `, ${photo.caption}` : ''}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <div
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full"
          style={{ backgroundColor: pickAvatarBg(photo.user?.name) }}
        >
          <span className="text-[22px] leading-none">{photo.user?.avatar_emoji || '👤'}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{photo.user?.name || 'Família'}</p>
          <p className="text-xs text-ink-secondary">{formatTimeAgo(photo.created_at)}</p>
        </div>
      </div>

      {/* Image */}
      <div
        className="relative mx-2 overflow-hidden rounded-xl"
        style={{ aspectRatio: `1 / ${ratio}` }}
      >
        <PhotoImage
          path={photo.image_url}
          alt={photo.caption || 'Foto de família'}
          width={800}
          className="absolute inset-0 h-full w-full"
        />
      </div>

      {/* Caption */}
      {photo.caption ? (
        <p className="px-4 pt-2.5 text-base leading-relaxed text-ink">{photo.caption}</p>
      ) : null}

      {/* Footer */}
      {hasFooter && (
        <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-2">
          <div className="flex flex-wrap gap-1.5">
            {reactionEntries.map(([emoji, count]) => (
              <span
                key={emoji}
                className="flex items-center gap-1 rounded-full border border-line bg-surface-alt px-2.5 py-1"
              >
                <span className="text-lg leading-none">{emoji}</span>
                <span className="text-sm font-medium text-ink-secondary">{count}</span>
              </span>
            ))}
          </div>
          {commentsCount > 0 && (
            <span className="text-sm font-medium text-ink-secondary">
              💬 {commentsCount} {commentsCount === 1 ? 'comentário' : 'comentários'}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function EmptyState({ isParent }: { isParent: boolean }) {
  return (
    <div className="flex flex-col items-center px-8 pt-32 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-surface-alt shadow-soft">
        <span className="animate-float text-[44px]">📷</span>
      </div>
      <h2 className="mb-2 text-xl font-bold text-ink">Ainda não há fotos!</h2>
      <p className="max-w-xs text-base leading-relaxed text-ink-secondary">
        {isParent
          ? 'Carrega no botão da câmara para partilhar um momento'
          : 'As fotos vão aparecer aqui quando forem partilhadas'}
      </p>
    </div>
  );
}

export default function FeedPage() {
  const { photos, loading, refreshing, error, refresh } = usePhotos();
  const { user } = useAuth();
  const router = useRouter();

  return (
    <>
      <AppHeader title="Vovo" brand />

      <div className="flex items-center justify-end px-4 pt-3">
        <button
          type="button"
          onClick={refresh}
          aria-label="Atualizar fotos"
          className="flex min-h-[44px] items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-ink-secondary active:bg-surface-alt"
        >
          <span className={refreshing ? 'inline-block animate-spin' : 'inline-block'}>↻</span>
          Atualizar
        </button>
      </div>

      {error && !loading && (
        <div className="mx-4 mb-2 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-center text-base text-ink">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center pt-32">
          <Spinner />
        </div>
      ) : photos.length === 0 && !error ? (
        <EmptyState isParent={user?.role === 'parent'} />
      ) : (
        <div className="flex flex-col gap-6 pt-4">
          {photos.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={i}
              onOpen={() => router.push(`/photo/${photo.id}`)}
            />
          ))}
        </div>
      )}
    </>
  );
}
