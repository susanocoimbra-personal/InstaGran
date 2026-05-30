'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Photo, Comment, Reaction } from '@/types/database';
import { useAuth } from './useAuth';

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
    Promise.all([fetchPhoto(), fetchComments(), fetchReactions()]).then(() => setLoading(false));

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
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [photoId, fetchPhoto, fetchComments, fetchReactions]);

  const addComment = async (text: string) => {
    if (!user) return;
    await supabase.from('comments').insert({ photo_id: photoId, user_id: user.id, text });
  };

  const toggleReaction = async (emoji: string) => {
    if (!user) return;
    const existing = reactions.find((r) => r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('reactions').insert({ photo_id: photoId, user_id: user.id, emoji });
    }
  };

  const deletePhoto = async (): Promise<{ error: string | null }> => {
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
          if (storageErr) console.warn('Storage cleanup error:', storageErr);
        });

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Erro ao apagar foto' };
    }
  };

  return { photo, comments, reactions, loading, addComment, toggleReaction, deletePhoto };
}
