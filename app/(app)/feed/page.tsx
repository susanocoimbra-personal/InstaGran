'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePhotos } from '@/hooks/usePhotos';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/AppHeader';
import Spinner from '@/components/Spinner';
import Carousel from '@/components/Carousel';
import { groupPhotos } from '@/lib/groupPhotos';
import { formatPlateDate } from '@/lib/format';
import type { FeedPost } from '@/types/database';

// A single plate in the diary: gallery label, framed print (or carousel),
// italic caption, quiet actions. The anchor photo carries caption/reactions/
// comments for the whole post (Instagram model).
function Plate({
  post,
  plateNo,
  onOpen,
  index,
}: {
  post: FeedPost;
  plateNo: string;
  onOpen: () => void;
  index: number;
}) {
  const { anchor, photos } = post;
  const reactionCount = (anchor.reactions || []).length;
  const commentsCount = anchor.comments_count ?? 0;

  // Clamp aspect ratio between 1:1 and 4:5 (portrait) using the anchor, so a
  // mixed-orientation group still shares one calm frame.
  const ratio =
    anchor.width && anchor.height && anchor.width > 0
      ? Math.min(5 / 4, Math.max(1, anchor.height / anchor.width))
      : 1;

  return (
    <figure
      className="mb-14 animate-rise-in"
      style={{ animationDelay: `${Math.min(index, 6) * 90}ms` }}
    >
      {/* Gallery label: plate number — author · date */}
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="label text-ink-muted">
          {plateNo} — {anchor.user?.name || 'Família'}
        </span>
        <span className="label text-ink-muted">{formatPlateDate(anchor.created_at)}</span>
      </div>

      {/* The print, or a carousel when the post has several photos */}
      <Carousel
        photos={photos}
        ratio={ratio}
        width={900}
        onSelect={onOpen}
        altPrefix={anchor.caption || `Fotografia de ${anchor.user?.name || 'família'}`}
      />

      {/* Caption as exhibition text */}
      {anchor.caption && (
        <figcaption className="mx-auto mt-4 max-w-[34ch] text-center font-serif text-[20px] italic leading-snug text-ink">
          “{anchor.caption}”
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

  // Group photos uploaded together into single carousel posts.
  const posts = useMemo(() => groupPhotos(photos), [photos]);

  // Newest post gets the highest plate number, like a growing diary.
  const total = posts.length;
  const plate = (i: number) => String(total - i).padStart(2, '0');

  return (
    <>
      <AppHeader title="Feed" avatar />

      <div className="mx-auto max-w-2xl px-6 sm:px-8">
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
            {posts.map((post, i) => (
              <Plate
                key={post.anchor.id}
                post={post}
                plateNo={plate(i)}
                index={i}
                onOpen={() => router.push(`/photo/${post.anchor.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
