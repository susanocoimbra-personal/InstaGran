'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Photo } from '@/types/database';

const FEED_LIMIT = 100; // Pragmatic cap — a family won't scroll past this in one sitting.

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('photos')
      .select(
        `
        *,
        user:users!uploaded_by(*),
        reactions(*),
        comments:comments(count)
      `,
      )
      .order('created_at', { ascending: false })
      .limit(FEED_LIMIT);

    if (queryError) {
      setError('Não foi possível carregar as fotos. Tenta atualizar.');
    } else if (data) {
      const mapped = data.map((p: Photo & { comments?: { count: number }[] }) => ({
        ...p,
        comments_count: p.comments?.[0]?.count || 0,
      }));
      setPhotos(mapped);
      setError(null);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchPhotos();

    const channel = supabase
      .channel('photos-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => {
        fetchPhotos();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => {
        fetchPhotos();
      });

    const subscription = channel.subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [fetchPhotos]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchPhotos();
  }, [fetchPhotos]);

  return { photos, loading, refreshing, error, refresh };
}
