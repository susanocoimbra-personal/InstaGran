'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAlbums } from '@/hooks/useAlbums';
import AppHeader from '@/components/AppHeader';

const MAX_IMAGES = 20;

interface PickedImage {
  file: File;
  url: string; // object URL for preview
  width: number;
  height: number;
}

async function readImage(file: File): Promise<PickedImage> {
  const url = URL.createObjectURL(file);
  const dims = await new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
  return { file, url, ...dims };
}

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { albums } = useAlbums();

  const [images, setImages] = useState<PickedImage[]>([]);
  const [caption, setCaption] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  // Keep a live ref to the picked images so the unmount cleanup revokes the
  // latest set without re-running on every change.
  const imagesRef = useRef<PickedImage[]>([]);
  imagesRef.current = images;

  // Revoke any outstanding object URLs if the user leaves mid-flow.
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, []);

  const onFilesPicked = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const all = Array.from(fileList);
    const room = Math.max(MAX_IMAGES - images.length, 0);
    if (all.length > room) {
      setNotice(`Máximo ${MAX_IMAGES} fotos de uma vez. ${room > 0 ? `Foram adicionadas as primeiras ${room}.` : 'Remove algumas primeiro.'}`);
    } else {
      setNotice(null);
    }
    const picked = await Promise.all(all.slice(0, room).map(readImage));
    setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index]?.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const upload = async () => {
    if (images.length === 0 || !user) return;
    setUploading(true);
    setProgress(0);
    setNotice(null);

    try {
      for (let i = 0; i < images.length; i++) {
        // Re-check the session each iteration: if it expired (or the user
        // logged out) mid-upload, stop instead of writing orphaned rows.
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error('A tua sessão terminou. Entra outra vez para continuar.');

        const img = images[i];
        const ext = (img.file.name.split('.').pop() || 'jpg').toLowerCase();
        const fileName = `${user.id}/${Date.now()}_${i}.${ext}`;
        const arrayBuffer = await img.file.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, arrayBuffer, {
            contentType: img.file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
            upsert: false,
          });
        if (uploadError) throw new Error(`Foto ${i + 1} de ${images.length}: ${uploadError.message}`);

        const { error: insertError } = await supabase.from('photos').insert({
          uploaded_by: user.id,
          image_url: fileName,
          // Caption goes on the first photo of a batch.
          caption: i === 0 ? caption.trim() || null : null,
          album_id: selectedAlbum,
          width: img.width || null,
          height: img.height || null,
        });
        if (insertError) throw new Error(`Foto ${i + 1} de ${images.length}: ${insertError.message}`);

        setProgress(i + 1);
      }

      // Success: confirm briefly before navigating so older users see it landed.
      images.forEach((img) => URL.revokeObjectURL(img.url));
      setImages([]);
      setCaption('');
      setSelectedAlbum(null);
      setDone(true);
      setTimeout(() => router.push('/feed'), 1100);
    } catch (err: unknown) {
      // Keep the picked images + caption intact so the user can simply retry.
      setNotice(err instanceof Error ? err.message : 'Erro no upload. Tenta outra vez.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const progressFraction = images.length > 0 ? progress / images.length : 0;

  if (done) {
    return (
      <>
        <AppHeader title="Nova Foto" />
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 text-center">
          <span className="mb-4 text-7xl">🎉</span>
          <h2 className="mb-1 text-2xl font-extrabold text-ink">Partilhado!</h2>
          <p className="text-base text-ink-secondary">A tua família já pode ver.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Nova Foto" />

      {/* Hidden native inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onFilesPicked(e.target.files)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onFilesPicked(e.target.files)}
      />

      <div className="p-4">
        {notice && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-accent/40 bg-accent-light/40 px-4 py-3 text-base text-ink">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Fechar aviso"
              className="shrink-0 text-ink-secondary"
            >
              ✕
            </button>
          </div>
        )}

        {images.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <span className="mb-4 text-7xl">📸</span>
            <h2 className="mb-1 text-2xl font-extrabold text-ink">Partilha um momento</h2>
            <p className="mb-8 text-base text-ink-secondary">Escolhe como queres adicionar fotos</p>

            <div className="flex w-full flex-col gap-4">
              {/* Camera gradient capped at #CB9A87 (lighter than brand primary) so
                  ink text clears WCAG AA 4.5:1 across the button for the 14px hint. */}
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex flex-col items-center gap-1 rounded-xl bg-gradient-to-br from-primary-light to-[#CB9A87] px-8 py-6 text-ink shadow-card active:scale-[0.99]"
              >
                <span className="text-4xl">📷</span>
                <span className="text-xl font-bold">Câmara</span>
                <span className="text-sm font-medium">Tira uma foto agora</span>
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex flex-col items-center gap-1 rounded-xl bg-gradient-to-br from-accent-light to-accent px-8 py-6 text-ink shadow-card active:scale-[0.99]"
              >
                <span className="text-4xl">🖼️</span>
                <span className="text-xl font-bold">Galeria</span>
                <span className="text-sm font-medium">Até 20 fotos de uma vez</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Count */}
            <div className="mb-4 flex items-center justify-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-base font-extrabold text-white">
                {images.length}
              </span>
              <span className="text-lg font-bold text-ink">
                {images.length === 1 ? 'foto selecionada' : 'fotos selecionadas'}
              </span>
            </div>

            {/* Preview grid */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              {images.map((img, index) => (
                // Blob URL is unique + stable per picked image, so it survives
                // mid-list removals correctly (index would not).
                <div key={img.url} className="relative aspect-square overflow-hidden rounded-xl shadow-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`Foto selecionada ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-[11px] font-extrabold text-white">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={`Remover foto ${index + 1}`}
                    className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-xl rounded-tr-xl bg-danger/90 text-sm font-extrabold text-white shadow-soft active:scale-95"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {/* Add more */}
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex aspect-square animate-pulse-soft flex-col items-center justify-center gap-0.5 rounded-xl border-[2.5px] border-dashed border-primary-light bg-surface-alt"
              >
                <span className="text-3xl font-light leading-none text-primary">+</span>
                <span className="text-xs font-bold text-primary">Mais</span>
              </button>
            </div>

            {/* Album selector */}
            {albums.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 font-bold text-ink">Álbum</p>
                <div className="no-scrollbar flex gap-2 overflow-x-auto py-1">
                  <button
                    type="button"
                    onClick={() => setSelectedAlbum(null)}
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-base font-semibold shadow-soft transition ${
                      !selectedAlbum
                        ? 'border-primary bg-primary text-white'
                        : 'border-line bg-surface text-ink'
                    }`}
                  >
                    Nenhum
                  </button>
                  {albums.map((album) => (
                    <button
                      key={album.id}
                      type="button"
                      onClick={() => setSelectedAlbum(album.id)}
                      className={`whitespace-nowrap rounded-full border px-4 py-2 text-base font-semibold shadow-soft transition ${
                        selectedAlbum === album.id
                          ? 'border-primary bg-primary text-white'
                          : 'border-line bg-surface text-ink'
                      }`}
                    >
                      {album.emoji} {album.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Caption */}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Adiciona uma legenda..."
              maxLength={200}
              rows={3}
              aria-label="Legenda da foto"
              className="w-full resize-none rounded-2xl border border-line bg-surface p-4 text-base text-ink outline-none placeholder:text-ink-secondary focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            <p className="mb-5 mt-1 pr-1 text-right text-xs text-ink-secondary">{caption.length}/200</p>

            {/* Submit */}
            <button
              type="button"
              onClick={upload}
              disabled={uploading}
              className="w-full overflow-hidden rounded-full bg-gradient-to-r from-primary to-primary-dark py-4 text-center shadow-card disabled:opacity-90"
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2 px-6">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    <span className="font-bold text-white">
                      A enviar {progress}/{images.length}...
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                    <div
                      className="h-full rounded-full bg-white transition-all"
                      style={{ width: `${progressFraction * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <span className="text-xl font-extrabold text-white">
                  Partilhar {images.length > 1 ? `${images.length} fotos` : 'com a família'}
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </>
  );
}
