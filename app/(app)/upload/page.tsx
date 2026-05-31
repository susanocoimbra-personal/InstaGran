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

    // Photos picked together become one carousel post: they share a group_id.
    // A single photo stays ungrouped (null). If the DB column doesn't exist yet
    // (migration not run), we retry the insert without it — graceful fallback.
    let groupId: string | null = images.length > 1 ? crypto.randomUUID() : null;

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

        const row: Record<string, unknown> = {
          uploaded_by: user.id,
          image_url: fileName,
          // Caption goes on the first photo of a batch (the carousel anchor).
          caption: i === 0 ? caption.trim() || null : null,
          album_id: selectedAlbum,
          width: img.width || null,
          height: img.height || null,
        };
        if (groupId) row.group_id = groupId;

        let { error: insertError } = await supabase.from('photos').insert(row);

        // If the group_id column isn't there yet, drop it and retry once;
        // disable grouping for the rest of the batch too.
        if (insertError && groupId && /group_id/.test(insertError.message)) {
          groupId = null;
          delete row.group_id;
          ({ error: insertError } = await supabase.from('photos').insert(row));
        }
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
        <AppHeader title="Adicionar" back avatar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 text-center">
          <p className="font-serif text-[28px] italic leading-tight text-ink">Partilhado.</p>
          <p className="mt-3 text-[15px] text-ink-muted">A tua família já pode ver.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Adicionar" back />

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

      <div className="mx-auto max-w-[440px] px-6 pt-4">
        {notice && (
          <div className="mb-5 flex items-start justify-between gap-3 border border-line bg-paper-dim px-4 py-3 text-[15px] text-ink">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Fechar aviso"
              className="shrink-0 text-ink-muted"
            >
              ✕
            </button>
          </div>
        )}

        {images.length === 0 ? (
          <div className="flex min-h-[58vh] flex-col items-center justify-center text-center">
            <p className="font-serif text-[26px] italic leading-tight text-ink">
              Que momento queres guardar?
            </p>

            <div className="mt-10 flex w-full flex-col gap-3">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex items-center justify-between border border-ink px-6 py-5 text-left transition active:bg-paper-dim"
              >
                <span className="font-serif text-xl text-ink">Tirar uma foto</span>
                <span className="label text-ink-muted">Câmara →</span>
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex items-center justify-between border border-line px-6 py-5 text-left transition active:bg-paper-dim"
              >
                <span className="font-serif text-xl text-ink">Escolher da galeria</span>
                <span className="label text-ink-muted">Até 20 →</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="label mb-4 text-ink-muted">
              {images.length} {images.length === 1 ? 'fotografia' : 'fotografias'}
            </p>

            {/* Preview grid */}
            <div className="mb-6 grid grid-cols-3 gap-2">
              {images.map((img, index) => (
                // Blob URL is unique + stable per picked image, so it survives
                // mid-list removals correctly (index would not).
                <div key={img.url} className="relative aspect-square overflow-hidden bg-paper-dim shadow-print">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`Foto selecionada ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={`Remover foto ${index + 1}`}
                    className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center bg-paper/85 text-base text-ink backdrop-blur active:scale-95"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {/* Add more */}
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex aspect-square items-center justify-center border border-dashed border-line text-2xl font-light text-ink-muted active:bg-paper-dim"
                aria-label="Adicionar mais fotos"
              >
                +
              </button>
            </div>

            {/* Album selector */}
            {albums.length > 0 && (
              <div className="mb-6">
                <p className="label mb-2 text-ink-muted">Álbum</p>
                <div className="no-scrollbar flex gap-2 overflow-x-auto py-1">
                  <button
                    type="button"
                    onClick={() => setSelectedAlbum(null)}
                    className={`label whitespace-nowrap rounded-full border px-4 py-2.5 transition ${
                      !selectedAlbum ? 'border-ink bg-ink text-paper' : 'border-line text-ink-muted'
                    }`}
                  >
                    Nenhum
                  </button>
                  {albums.map((album) => (
                    <button
                      key={album.id}
                      type="button"
                      onClick={() => setSelectedAlbum(album.id)}
                      className={`label whitespace-nowrap rounded-full border px-4 py-2.5 transition ${
                        selectedAlbum === album.id
                          ? 'border-ink bg-ink text-paper'
                          : 'border-line text-ink-muted'
                      }`}
                    >
                      {album.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Caption */}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escreve uma legenda…"
              maxLength={200}
              rows={3}
              aria-label="Legenda da foto"
              className="w-full resize-none border-b border-line bg-transparent pb-2 font-serif text-[19px] italic text-ink outline-none placeholder:text-ink-faint focus:border-ink"
            />
            <p className="label mb-7 mt-2 text-right text-ink-faint">{caption.length}/200</p>

            {/* Submit */}
            <button
              type="button"
              onClick={upload}
              disabled={uploading}
              className="label flex min-h-[52px] w-full items-center justify-center rounded-full bg-ink px-6 text-paper transition active:scale-[0.99] disabled:opacity-50"
            >
              {uploading ? (
                <span className="flex items-center gap-3">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
                  A enviar {progress}/{images.length}
                </span>
              ) : (
                `Publicar ${images.length > 1 ? `${images.length} fotografias` : 'no diário'}`
              )}
            </button>
            {uploading && (
              <div className="mt-3 h-px w-full overflow-hidden bg-line">
                <div
                  className="h-full bg-ink transition-all"
                  style={{ width: `${progressFraction * 100}%` }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
