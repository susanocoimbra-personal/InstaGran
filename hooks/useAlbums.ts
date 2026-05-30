'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Album } from '@/types/database';

export function useAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlbums = useCallback(async () => {
    const { data, error } = await supabase
      .from('albums')
      .select('*, photos:photos(count)')
      .order('created_at', { ascending: true });

    if (!error && data) {
      const mapped = data.map((a: any) => ({
        ...a,
        photos_count: a.photos?.[0]?.count || 0,
      }));
      setAlbums(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAlbums();

    const channel = supabase
      .channel('albums-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'albums' }, () => {
        fetchAlbums();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlbums]);

  const createAlbum = async (name: string, emoji: string, userId: string) => {
    const { error } = await supabase.from('albums').insert({
      name,
      emoji,
      created_by: userId,
    });
    return { error: error?.message || null };
  };

  const deleteAlbum = async (albumId: string) => {
    await supabase.from('photos').update({ album_id: null }).eq('album_id', albumId);
    const { error } = await supabase.from('albums').delete().eq('id', albumId);
    return { error: error?.message || null };
  };

  return { albums, loading, createAlbum, deleteAlbum, refresh: fetchAlbums };
}
