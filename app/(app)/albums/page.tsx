'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAlbums } from '@/hooks/useAlbums';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/AppHeader';
import Spinner from '@/components/Spinner';
import type { Album } from '@/types/database';

const ALBUM_EMOJIS = ['📸', '🎄', '🏖️', '🎂', '🎉', '👶', '🏠', '🌸', '⛪', '🎅', '🐣', '🎃'];

// Soft scrapbook gradient pairs (from/to) for album cards.
const CARD_GRADIENTS = [
  ['#F8E8E0', '#F3D5C8'],
  ['#E0F0E8', '#C8E0D5'],
  ['#E8E0F8', '#D5C8F3'],
  ['#FFF5E0', '#F3E4C0'],
  ['#E0EAF8', '#C8D8F3'],
  ['#F8E0EC', '#F3C8D8'],
  ['#E8F8E0', '#D0ECC0'],
  ['#F8F0E0', '#EEE0C8'],
];

export default function AlbumsPage() {
  const { albums, loading, createAlbum, deleteAlbum } = useAlbums();
  const { user } = useAuth();
  const router = useRouter();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('📸');
  const [creating, setCreating] = useState(false);

  const isParent = user?.role === 'parent';

  const handleCreate = async () => {
    if (!newName.trim() || !user) return;
    setCreating(true);
    const { error } = await createAlbum(newName.trim(), newEmoji, user.id);
    if (error) alert(error);
    setNewName('');
    setNewEmoji('📸');
    setShowCreate(false);
    setCreating(false);
  };

  const handleDelete = async (album: Album) => {
    if (
      !confirm(
        `Queres apagar o álbum "${album.name}"? As fotos não serão apagadas, apenas desassociadas.`,
      )
    ) {
      return;
    }
    const { error } = await deleteAlbum(album.id);
    if (error) alert(error);
  };

  const openAlbum = (albumId: string | null, name: string, emoji: string) => {
    const params = new URLSearchParams({ name, emoji });
    router.push(`/albums/${albumId ?? 'all'}?${params.toString()}`);
  };

  return (
    <>
      <AppHeader title="Álbuns" />

      {loading ? (
        <div className="flex justify-center pt-32">
          <Spinner />
        </div>
      ) : (
        <div className="p-4">
          {/* Hero — all photos */}
          <button
            type="button"
            onClick={() => openAlbum(null, 'Todas as fotos', '📷')}
            className="mb-4 flex w-full items-center gap-4 rounded-xl p-5 text-left shadow-card active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg, #D9A899, #EDD4A0)' }}
          >
            <span className="text-[44px]">📷</span>
            <span className="flex-1">
              <span className="block text-xl font-extrabold text-ink">Todas as fotos</span>
              <span className="block text-sm font-medium text-ink/80">Ver toda a coleção da família</span>
            </span>
            <span className="text-3xl font-light text-ink-secondary">›</span>
          </button>

          {albums.length === 0 ? (
            <div className="flex flex-col items-center px-8 pt-16 text-center">
              <span className="mb-4 text-7xl">🏡</span>
              <h2 className="mb-2 text-xl font-extrabold text-ink">Sem álbuns ainda</h2>
              <p className="text-base leading-relaxed text-ink-secondary">
                Cria o primeiro álbum para organizar as memórias da família
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {albums.map((album, index) => {
                const [from, to] = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
                return (
                  <div key={album.id} className="relative">
                    <button
                      type="button"
                      onClick={() => openAlbum(album.id, album.name, album.emoji)}
                      aria-label={`Abrir álbum ${album.name}, ${album.photos_count} ${album.photos_count === 1 ? 'foto' : 'fotos'}`}
                      className="flex min-h-[180px] w-full flex-col items-center justify-center overflow-hidden rounded-xl px-4 py-8 shadow-card active:scale-[0.98]"
                      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                    >
                      <span className="absolute right-0 top-0 h-10 w-10 rounded-bl-[24px] bg-white/45" />
                      <span className="mb-2 text-5xl">{album.emoji}</span>
                      <span className="text-center text-base font-bold leading-tight text-ink">
                        {album.name}
                      </span>
                      <span className="mt-1 text-xs font-medium text-ink-secondary">
                        {album.photos_count} {album.photos_count === 1 ? 'foto' : 'fotos'}
                      </span>
                    </button>
                    {isParent && (
                      <button
                        type="button"
                        aria-label={`Apagar álbum ${album.name}`}
                        onClick={() => handleDelete(album)}
                        className="absolute bottom-1.5 right-1.5 flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-base text-ink-secondary shadow-soft active:scale-95"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      {isParent && (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          aria-label="Criar álbum"
          className="fixed bottom-28 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-3xl text-white shadow-lift active:scale-95"
        >
          +
        </button>
      )}

      {/* Create modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex flex-col items-center">
              <div className="mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-surface-alt text-4xl">
                {newEmoji}
              </div>
              <h3 className="text-xl font-extrabold text-ink">Novo Álbum</h3>
              <p className="mt-1 text-sm text-ink-secondary">Escolhe um ícone e dá um nome</p>
            </div>

            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {ALBUM_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewEmoji(emoji)}
                  className={`flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 text-2xl ${
                    newEmoji === emoji
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent bg-background'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do álbum..."
              maxLength={30}
              autoFocus
              aria-label="Nome do álbum"
              className="mb-6 w-full rounded-2xl border border-line bg-background p-4 text-base text-ink outline-none placeholder:text-ink-secondary focus:border-primary focus:ring-2 focus:ring-primary/30"
            />

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewName('');
                }}
                className="flex-1 rounded-full bg-surface-alt py-3 font-semibold text-ink-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="flex flex-1 items-center justify-center rounded-full bg-primary py-3 font-bold text-white disabled:bg-ink-light disabled:text-surface"
              >
                {creating ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  'Criar Álbum'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
