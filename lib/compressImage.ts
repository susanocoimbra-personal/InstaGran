// Client-side image compression. Phone photos are often 4-12 MB; for a family
// viewing app that's wasteful to store and slow to load. We downscale the long
// edge to MAX_EDGE and re-encode as JPEG, which typically cuts a photo to a few
// hundred KB with no visible quality loss on a phone screen.

const MAX_EDGE = 1600; // px — plenty for full-screen viewing on any phone
const QUALITY = 0.82;

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Downscale + re-encode an image File to JPEG. Falls back to the original file
 * if the browser can't decode it or the result would be larger than the source.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  // Only attempt to compress raster images.
  if (!file.type.startsWith('image/')) {
    const dims = await readDims(file).catch(() => ({ width: 0, height: 0 }));
    return { blob: file, ...dims };
  }

  let bitmap: ImageBitmap | HTMLImageElement;
  let srcW: number;
  let srcH: number;

  try {
    // createImageBitmap is fast and handles EXIF orientation in modern browsers.
    bitmap = await createImageBitmap(file);
    srcW = bitmap.width;
    srcH = bitmap.height;
  } catch {
    // Fallback to <img> decode (e.g. older Safari).
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImg(url);
      bitmap = img;
      srcW = img.naturalWidth;
      srcH = img.naturalHeight;
    } catch {
      URL.revokeObjectURL(url);
      return { blob: file, width: 0, height: 0 };
    }
    URL.revokeObjectURL(url);
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(srcW, srcH));
  const outW = Math.max(1, Math.round(srcW * scale));
  const outH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { blob: file, width: srcW, height: srcH };
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, outW, outH);
  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY),
  );

  // If compression failed or somehow grew the file, keep the original.
  if (!blob || blob.size >= file.size) {
    return { blob: file, width: srcW, height: srcH };
  }
  return { blob, width: outW, height: outH };
}

function readDims(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  return loadImg(url)
    .then((img) => ({ width: img.naturalWidth, height: img.naturalHeight }))
    .finally(() => URL.revokeObjectURL(url));
}

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
