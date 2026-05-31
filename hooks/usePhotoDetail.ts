'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Photo, Comment, Reaction } from '@/types/database';
import { useAuth } from './useAuth';

type Result = { error: string | null };

export function usePhotoDetail(photoId: string) {
  const { user } = useAuth();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPhoto = useCallback(async () => {
    const { data } = await supabase
      .from('photos')
      .select('*, user:users!uploaded_by(*)')
      .eq('id', photoId)
      .single();
    if (data) setPhoto(data);
  }, [photoId]);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, user:users!user_id(*)')
      .eq('photo_id', photoId)
      .order('created_at', { ascending: true });
    if (data) setComments(data);
  }, [photoId]);

  const fetchReactions = useCallback(async () => {
    const { data } = await supabase
      .from('reactions')
      .select('*, user:users!user_id(*)')
      .eq('photo_id', photoId);
    if (data) setReactions(data);
  }, [photoId]);

  useEffect(() => {
    Promise.all([fetchPhoto(), fetchComments(), fetchReactions()])
      .catch(() => {
        /* individual fetchers already no-op on error; ensure loading clears */
      })
      .finally(() => setLoading(false));

    const channel = supabase
      .channel(`photo-${photoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `photo_id=eq.${photoId}` },
        () => fetchComments(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reactions', filter: `photo_id=eq.${photoId}` },
        () => fetchReactions(),
      );

    const subscription = channel.subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [photoId, fetchPhoto, fetchComments, fetchReactions]);

  const addComment = async (text: string): Promise<Result> => {
    if (!user) return { error: 'Sessão terminada. Entra outra vez.' };
    const { error } = await supabase.from('comments').insert({
      photo_id: photoId,
      user_id: user.id,
      text,
    });
    return { error: error?.message || null };
  };

  const deleteComment = async (commentId: string): Promise<Result> => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    return { error: error?.message || null };
  };

  const toggleReaction = async (emoji: string): Promise<Result> => {
    if (!user) return { error: 'Sessão terminada. Entra outra vez.' };
    const existing = reactions.find((r) => r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      const { error } = await supabase.from('reactions').delete().eq('id', existing.id);
      return { error: error?.message || null };
    }
    const { error } = await supabase.from('reactions').insert({
      photo_id: photoId,
      user_id: user.id,
      emoji,
    });
    return { error: error?.message || null };
  };

  const updateCaption = async (caption: string): Promise<Result> => {
    if (!user || user.role !== 'parent') return { error: 'Sem permissão' };
    const { error } = await supabase
      .from('photos')
      .update({ caption: caption.trim() || null })
      .eq('id', photoId);
    if (error) return { error: error.message };
    // No realtime subscription on the photos row here, so refresh it ourselves
    // to reflect the new caption immediately.
    await fetchPhoto();
    return { error: null };
  };

  const deletePhoto = async (): Promise<Result> => {
    if (!user || user.role !== 'parent' || !photo) {
      return { error: 'Sem permissão' };
    }
    try {
      await supabase.from('comments').delete().eq('photo_id', photoId);
      await supabase.from('reactions').delete().eq('photo_id', photoId);

      const { error } = await supabase.from('photos').delete().eq('id', photoId);
      if (error) return { error: error.message };

      // Storage cleanup is best-effort — the row is already gone.
      supabase.storage
        .from('photos')
        .remove([photo.image_url])
        .then(({ error: storageErr }) => {
          if (process.env.NODE_ENV === 'development' && storageErr) {
            console.warn('Storage cleanup error:', storageErr);
          }
        });

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Erro ao apagar foto' };
    }
  };

  return {
    photo,
    comments,
    reactions,
    loading,
    addComment,
    deleteComment,
    toggleReaction,
    updateCaption,
    deletePhoto,
  };
}
