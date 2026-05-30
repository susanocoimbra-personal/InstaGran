'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePhotoDetail } from '@/hooks/usePhotoDetail';
import { useAuth } from '@/hooks/useAuth';
import { publicPhotoUrl } from '@/lib/supabase';
import AppHeader from '@/components/AppHeader';
import Spinner from '@/components/Spinner';
import PhotoImage from '@/components/PhotoImage';
import { formatLongDate, getBubbleColor } from '@/lib/format';

const REACTION_EMOJIS = ['❤️', '😍', '😂', '😮', '🥰', '👏'];

export default function PhotoDetailPage() {
  const params = useParams<{ id: string }>();
  const photoId = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const { photo, comments, reactions, loading, addComment, toggleReaction, deletePhoto } =
    usePhotoDetail(photoId);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  const reactionGroups = useMemo(
    () =>
      reactions.reduce(
        (acc: Record<string, { count: number; mine: boolean }>, r) => {
          if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
          acc[r.emoji].count++;
          if (r.user_id === user?.id) acc[r.emoji].mine = true;
          return acc;
        },
        {},
      ),
    [reactions, user?.id],
  );

  if (loading || !photo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  const handleSend = async () => {
    const text = commentText.trim();
    if (!text) return;
    setSending(true);
    await addComment(text);
    setCommentText('');
    setSending(false);
  };

  const handleDelete = async () => {
    if (!confirm('Queres apagar esta foto?')) return;
    const { error } = await deletePhoto();
    if (error) alert(error);
    else router.back();
  };

  const handleDownload = async () => {
    try {
      const url = publicPhotoUrl(photo.image_url);
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `vovo_${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      alert('Não foi possível guardar a foto.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader title="Foto" back />

      <div className="flex-1 overflow-y-auto pb-28">
        {/* Image */}
        <div className="overflow-hidden rounded-b-3xl bg-surface-alt">
          <PhotoImage
            path={photo.image_url}
            alt={photo.caption || 'Foto de família'}
            fit="cover"
            className="aspect-[4/5] w-full"
          />
        </div>

        {/* User row */}
        <div className="flex items-center gap-2 px-4 pb-2 pt-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light">
            <span className="text-[22px]">{photo.user?.avatar_emoji || '👤'}</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-ink">{photo.user?.name}</p>
            <p className="text-xs text-ink-secondary">{formatLongDate(photo.created_at)}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              aria-label="Guardar foto"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt text-lg active:scale-95"
            >
              💾
            </button>
            {user?.role === 'parent' && (
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Apagar foto"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/15 text-lg active:scale-95"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* Caption */}
        {photo.caption ? (
          <p className="px-4 pb-2 pt-1 text-lg font-medium leading-relaxed text-ink">
            {photo.caption}
          </p>
        ) : null}

        {/* Reactions */}
        <div className="flex gap-2 px-4 py-2">
          {REACTION_EMOJIS.map((emoji) => {
            const group = reactionGroups[emoji];
            const active = group?.mine;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => toggleReaction(emoji)}
                aria-pressed={active}
                className={`flex flex-1 items-center justify-center gap-1 rounded-2xl border-[1.5px] py-2.5 shadow-soft transition active:scale-95 ${
                  active ? 'border-primary bg-primary/10' : 'border-line bg-surface'
                }`}
              >
                {/* `key` flips with active state so the pop replays on each toggle. */}
                <span key={active ? 'on' : 'off'} className={`text-[22px] ${active ? 'animate-pop' : ''}`}>
                  {emoji}
                </span>
                {group && (
                  <span
                    className={`text-xs font-bold ${active ? 'text-primary-dark' : 'text-ink-secondary'}`}
                  >
                    {group.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Comments */}
        <div className="mt-2 border-t border-line px-4 pb-2 pt-4">
          <h2 className="text-lg font-bold text-ink">Comentários ({comments.length})</h2>
        </div>

        {comments.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="mb-2 text-4xl">💬</span>
            <p className="text-base text-ink-light">Ainda sem comentários. Sê o primeiro!</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1 px-4">
            {comments.map((c) => (
              <li key={c.id} className="flex items-start gap-2 py-1">
                <span className="mt-1 text-2xl">{c.user?.avatar_emoji || '👤'}</span>
                <div
                  className="flex-1 rounded-2xl rounded-tl px-4 py-2"
                  style={{ backgroundColor: getBubbleColor(c.user_id || c.id) }}
                >
                  <p className="mb-0.5 text-sm font-bold text-ink">{c.user?.name}</p>
                  <p className="text-base leading-snug text-ink">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Input bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-end gap-2 border-t border-line bg-surface p-2 pb-3 safe-bottom">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Escreve um comentário..."
          rows={1}
          maxLength={500}
          className="max-h-24 flex-1 resize-none rounded-full border border-line bg-background px-4 py-2.5 text-base text-ink outline-none placeholder:text-ink-light focus:border-primary"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !commentText.trim()}
          aria-label="Enviar comentário"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-primary text-xl text-white disabled:opacity-40"
        >
          {sending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            '➤'
          )}
        </button>
      </div>
    </div>
  );
}
