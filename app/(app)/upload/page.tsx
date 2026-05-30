'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAlbums } from '@/hooks/useAlbums';
import AppHeader from '@/components/AppHeader';

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

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const onFilesPicked = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const picked = await Promise.all(Array.from(fileList).slice(0, 20).map(readImage));
    setImages((prev) => [...prev, ...picked]);
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

    try {
      for (let i = 0; i < images.length; i++) {
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
        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase.from('photos').insert({
          uploaded_by: user.id,
          image_url: fileName,
          // Caption goes on the first photo of a batch.
          caption: i === 0 ? caption.trim() || null : null,
          album_id: selectedAlbum,
          width: img.width || null,
          height: img.height || null,
        });
        if (insertError) throw insertError;

        setProgress(i + 1);
      }

      images.forEach((img) => URL.revokeObjectURL(img.url));
      setImages([]);
      setCaption('');
      setSelectedAlbum(null);
      router.push('/feed');
    } catch (err: any) {
      alert(`Erro no upload: ${err.message || 'Tenta outra vez.'}`);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const progressFraction = images.length > 0 ? progress / images.length : 0;

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
                <div key={img.url} className="relative aspect-square overflow-hidden rounded-xl shadow-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-[11px] font-extrabold text-white">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label="Remover foto"
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-danger/90 text-xs font-extrabold text-white shadow-soft"
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
              className="mb-5 w-full resize-none rounded-2xl border border-line bg-surface p-4 text-base text-ink outline-none placeholder:text-ink-light focus:border-primary"
            />

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
