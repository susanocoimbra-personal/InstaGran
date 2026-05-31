'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePhotoDetail } from '@/hooks/usePhotoDetail';
import { useAuth } from '@/hooks/useAuth';
import { publicPhotoUrl } from '@/lib/supabase';
import AppHeader from '@/components/AppHeader';
import Spinner from '@/components/Spinner';
import PhotoImage from '@/components/PhotoImage';
import { formatLongDate } from '@/lib/format';

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
    <div className="flex min-h-screen flex-col bg-paper">
      <AppHeader back />

      <div className="flex-1 overflow-y-auto pb-28">
        {/* The print — full bleed, sitting on paper */}
        <div className="bg-paper-dim">
          <PhotoImage
            path={photo.image_url}
            alt={photo.caption || 'Fotografia de família'}
            fit="cover"
            className="max-h-[70vh] w-full"
          />
        </div>

        <div className="mx-auto max-w-[440px] px-6">
          {/* Exhibition label: author · date, with quiet save/delete actions */}
          <div className="flex items-center justify-between gap-2 border-b border-line py-3.5">
            <span className="label text-ink-muted">
              {photo.user?.name} · {formatLongDate(photo.created_at)}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDownload}
                aria-label="Guardar foto"
                className="label flex h-11 items-center px-2 text-ink-muted active:text-ink"
              >
                Guardar
              </button>
              {isParent && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  aria-label="Apagar foto"
                  className="label flex h-11 items-center px-2 text-ink-muted active:text-danger disabled:opacity-50"
                >
                  {deleting ? '…' : 'Apagar'}
                </button>
              )}
            </div>
          </div>

          {/* Caption — serif italic, editable inline by parents */}
          {editingCaption ? (
            <div className="py-4">
              <textarea
                value={captionDraft}
                onChange={(e) => setCaptionDraft(e.target.value)}
                maxLength={200}
                rows={2}
                autoFocus
                aria-label="Editar legenda"
                className="w-full resize-none border-b border-line bg-transparent pb-2 font-serif text-[20px] italic text-ink outline-none placeholder:text-ink-faint focus:border-ink"
                placeholder="Escreve uma legenda…"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCaption(false)}
                  className="label px-4 py-2 text-ink-muted active:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveCaption}
                  disabled={savingCaption}
                  className="label flex items-center rounded-full bg-ink px-5 py-2.5 text-paper disabled:opacity-50"
                >
                  {savingCaption ? '…' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : photo.caption ? (
            <div className="flex items-start justify-between gap-3 py-5">
              <p className="flex-1 break-words font-serif text-[22px] italic leading-snug text-ink">
                “{photo.caption}”
              </p>
              {isParent && (
                <button
                  type="button"
                  onClick={startEditCaption}
                  aria-label="Editar legenda"
                  className="label mt-1 shrink-0 text-ink-muted active:text-ink"
                >
                  Editar
                </button>
              )}
            </div>
          ) : isParent ? (
            <button
              type="button"
              onClick={startEditCaption}
              className="label py-4 text-ink-muted active:text-ink"
            >
              + Adicionar legenda
            </button>
          ) : (
            <div className="py-2" />
          )}

          {/* Reactions — a quiet typographic row */}
          <div className="flex flex-wrap gap-2 border-t border-line py-4">
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
                  className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full border px-3 transition active:scale-95 ${
                    active ? 'border-ink bg-ink/[0.04]' : 'border-line'
                  }`}
                >
                  <span key={active ? 'on' : 'off'} className={`text-[20px] ${active ? 'animate-rise-in' : ''}`}>
                    {emoji}
                  </span>
                  {group && <span className="text-sm font-medium text-ink-soft">{group.count}</span>}
                </button>
              );
            })}
          </div>

          {/* Comments */}
          <p className="label border-t border-line pb-1 pt-5 text-ink-muted">
            {comments.length === 1 ? '1 comentário' : `${comments.length} comentários`}
          </p>

          {comments.length === 0 ? (
            <p className="py-6 text-center font-serif text-[17px] italic text-ink-muted">
              Ainda sem comentários. Escreve o primeiro.
            </p>
          ) : (
            <ul className="flex flex-col">
              {comments.map((c) => {
                const canDelete = c.user_id === user?.id || isParent;
                return (
                  <li key={c.id} className="flex items-start justify-between gap-3 border-b border-line py-4">
                    <div className="min-w-0 flex-1">
                      <span className="label text-ink-muted">{c.user?.name}</span>
                      <p className="mt-1 break-words text-[16px] leading-snug text-ink-soft">{c.text}</p>
                    </div>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        aria-label="Apagar comentário"
                        className="label flex h-11 shrink-0 items-center text-ink-faint active:text-danger"
                      >
                        Apagar
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-[440px] items-end gap-3 px-6 py-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Escreve um comentário…"
            rows={1}
            maxLength={500}
            aria-label="Escrever um comentário"
            className="max-h-24 flex-1 resize-none border-b border-line bg-transparent py-2.5 font-serif text-[17px] italic text-ink outline-none placeholder:text-ink-faint focus:border-ink"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !commentText.trim()}
            aria-label="Enviar comentário"
            className="label flex h-11 shrink-0 items-center text-ink disabled:text-ink-faint"
          >
            {sending ? '…' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}
