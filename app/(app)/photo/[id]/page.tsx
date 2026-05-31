'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const { user, session, loading: authLoading } = useAuth();
  const {
    photo,
    comments,
    reactions,
    loading,
    addComment,
    deleteComment,
    toggleReaction,
    updateCaption,
    deletePhoto,
  } = usePhotoDetail(photoId);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState('');
  const [savingCaption, setSavingCaption] = useState(false);

  const isParent = user?.role === 'parent';

  // If the session drops while viewing, bounce to login (the (app) layout only
  // guards on mount; this catches an expiry that happens while we're here).
  useEffect(() => {
    if (!authLoading && !session) router.replace('/login');
  }, [authLoading, session, router]);

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
    const { error } = await addComment(text);
    if (error) {
      alert(`Não foi possível enviar: ${error}`); // keep the text so they can retry
    } else {
      setCommentText('');
    }
    setSending(false);
  };

  const handleReaction = async (emoji: string) => {
    const { error } = await toggleReaction(emoji);
    if (error) alert(error);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Apagar este comentário?')) return;
    const { error } = await deleteComment(commentId);
    if (error) alert(error);
  };

  const startEditCaption = () => {
    setCaptionDraft(photo.caption || '');
    setEditingCaption(true);
  };

  const saveCaption = async () => {
    setSavingCaption(true);
    const { error } = await updateCaption(captionDraft);
    setSavingCaption(false);
    if (error) alert(error);
    else setEditingCaption(false);
  };

  const handleDelete = async () => {
    if (deleting) return;
    if (!confirm('Queres apagar esta foto? Esta ação não pode ser desfeita.')) return;
    setDeleting(true);
    const { error } = await deletePhoto();
    if (error) {
      alert(error);
      setDeleting(false);
    } else {
      router.back();
    }
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
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-alt text-lg active:scale-95"
            >
              💾
            </button>
            {isParent && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Apagar foto"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-danger/15 text-lg active:scale-95 disabled:opacity-50"
              >
                {deleting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-danger/40 border-t-danger" />
                ) : (
                  '🗑️'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Caption (parents can edit it inline) */}
        {editingCaption ? (
          <div className="px-4 pb-2 pt-1">
            <textarea
              value={captionDraft}
              onChange={(e) => setCaptionDraft(e.target.value)}
              maxLength={200}
              rows={2}
              autoFocus
              aria-label="Editar legenda"
              className="w-full resize-none rounded-2xl border border-line bg-surface p-3 text-base text-ink outline-none placeholder:text-ink-secondary focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="Adiciona uma legenda..."
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCaption(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-ink-secondary active:bg-surface-alt"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveCaption}
                disabled={savingCaption}
                className="flex items-center rounded-full bg-primary px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {savingCaption ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          </div>
        ) : photo.caption ? (
          <div className="flex items-start gap-2 px-4 pb-2 pt-1">
            <p className="flex-1 break-words text-lg font-medium leading-relaxed text-ink">
              {photo.caption}
            </p>
            {isParent && (
              <button
                type="button"
                onClick={startEditCaption}
                aria-label="Editar legenda"
                className="mt-1 shrink-0 text-base text-ink-secondary active:text-ink"
              >
                ✎
              </button>
            )}
          </div>
        ) : isParent ? (
          <button
            type="button"
            onClick={startEditCaption}
            className="px-4 pb-2 pt-1 text-base text-ink-secondary active:text-ink"
          >
            ✎ Adicionar legenda
          </button>
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
                onClick={() => handleReaction(emoji)}
                aria-pressed={active}
                aria-label={`Reagir com ${emoji}`}
                className={`flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-2xl border-[1.5px] py-3 shadow-soft transition active:scale-95 ${
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
            {comments.map((c) => {
              const canDelete = c.user_id === user?.id || isParent;
              return (
                <li key={c.id} className="flex items-start gap-2 py-1">
                  <span className="mt-1 text-2xl">{c.user?.avatar_emoji || '👤'}</span>
                  <div
                    className="flex-1 rounded-2xl rounded-tl px-4 py-2"
                    style={{ backgroundColor: getBubbleColor(c.user_id || c.id) }}
                  >
                    <p className="mb-0.5 text-sm font-bold text-ink">{c.user?.name}</p>
                    <p className="break-words text-base leading-snug text-ink">{c.text}</p>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      aria-label="Apagar comentário"
                      className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base text-ink-light active:bg-surface-alt active:text-ink"
                    >
                      🗑️
                    </button>
                  )}
                </li>
              );
            })}
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
          aria-label="Escrever um comentário"
          className="max-h-24 flex-1 resize-none rounded-3xl border border-line bg-background px-4 py-3 text-base text-ink outline-none placeholder:text-ink-secondary focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !commentText.trim()}
          aria-label="Enviar comentário"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-xl text-white disabled:opacity-40"
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
