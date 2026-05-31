'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAlbums } from '@/hooks/useAlbums';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/AppHeader';
import Spinner from '@/components/Spinner';
import type { Album } from '@/types/database';

const ALBUM_EMOJIS = ['📸', '🎄', '🏖️', '🎂', '🎉', '👶', '🏠', '🌸', '⛪', '🎅', '🐣', '🎃'];

export default function AlbumsPage() {
  const { albums, loading, error, createAlbum, deleteAlbum } = useAlbums();
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
      <AppHeader title="Álbuns" avatar />

      <div className="mx-auto max-w-[440px] px-6">
        {loading ? (
          <div className="flex justify-center pt-28">
            <Spinner />
          </div>
        ) : (
          <>
            {/* Featured: the whole collection */}
            <button
              type="button"
              onClick={() => openAlbum(null, 'Todas as fotos', '📷')}
              className="flex w-full items-baseline justify-between border-b border-ink py-5 text-left"
            >
              <span className="font-serif text-[26px] leading-none text-ink">Todas as fotos</span>
              <span className="label text-ink-muted">Ver →</span>
            </button>

            {error && (
              <p className="mt-4 text-center text-[15px] text-ink-muted">{error}</p>
            )}

            {albums.length === 0 ? (
              <p className="px-2 pt-10 text-center font-serif text-[19px] italic leading-snug text-ink-muted">
                Ainda não há álbuns.
                {isParent && ' Cria o primeiro para organizar as memórias.'}
              </p>
            ) : (
              <ul>
                {albums.map((album, i) => (
                  <li key={album.id} className="flex items-center gap-3 border-b border-line">
                    <button
                      type="button"
                      onClick={() => openAlbum(album.id, album.name, album.emoji)}
                      className="flex flex-1 items-center gap-4 py-5 text-left"
                    >
                      <span className="label w-6 shrink-0 text-ink-faint">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-2xl">{album.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-[22px] leading-tight text-ink">
                          {album.name}
                        </span>
                        <span className="label text-ink-muted">
                          {album.photos_count} {album.photos_count === 1 ? 'foto' : 'fotos'}
                        </span>
                      </span>
                    </button>
                    {isParent && (
                      <button
                        type="button"
                        aria-label={`Apagar álbum ${album.name}`}
                        onClick={() => handleDelete(album)}
                        className="label flex h-11 shrink-0 items-center pl-2 text-ink-faint active:text-danger"
                      >
                        Apagar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Create — a quiet text affordance, not a floating button */}
            {isParent && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="label mt-6 flex min-h-[44px] items-center text-ink active:text-clay"
              >
                + Criar álbum
              </button>
            )}
          </>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
          onClick={() => setShowCreate(false)}
        >
          <div
            style={{ ['--safe-pad-bottom' as string]: '32px' }}
            className="w-full max-w-[440px] bg-paper p-6 pb-8 shadow-lift safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="label mb-5 text-ink-muted">Novo álbum</p>

            {/* Emoji picker */}
            <div className="mb-5 flex flex-wrap gap-2">
              {ALBUM_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewEmoji(emoji)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border text-2xl ${
                    newEmoji === emoji ? 'border-ink bg-ink/[0.04]' : 'border-line'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do álbum…"
              maxLength={30}
              autoFocus
              aria-label="Nome do álbum"
              className="mb-6 w-full border-b border-line bg-transparent pb-2 font-serif text-[22px] italic text-ink outline-none placeholder:text-ink-faint focus:border-ink"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewName('');
                }}
                className="label px-4 py-3 text-ink-muted active:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="label flex min-h-[44px] items-center rounded-full bg-ink px-6 text-paper disabled:opacity-40"
              >
                {creating ? '…' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
