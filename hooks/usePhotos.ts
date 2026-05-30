'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Photo } from '@/types/database';

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPhotos = useCallback(async () => {
    const { data, error } = await supabase
      .from('photos')
      .select(
        `
        *,
        user:users!uploaded_by(*),
        reactions(*),
        comments:comments(count)
      `,
      )
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mapped = data.map((p: any) => ({
        ...p,
        comments_count: p.comments?.[0]?.count || 0,
      }));
      setPhotos(mapped);
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
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPhotos]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchPhotos();
  }, [fetchPhotos]);

  return { photos, loading, refreshing, refresh };
}
