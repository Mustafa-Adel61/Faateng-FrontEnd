const DEFAULT_MAX_EDGE = 1280;
const DEFAULT_QUALITY = 0.82;
const SMALL_ENOUGH_BYTES = 400 * 1024;

export interface DownscaleOptions {
  maxEdge?: number;
  quality?: number;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not decode image'));
    image.src = src;
  });
}

/**
 * Photos are stored as base64 data-URLs inside a JSON payload, so an untouched
 * 4 MB phone photo becomes ~5.3 MB of base64 (33% overhead) that the API has to
 * return on every detail fetch, and the browser then has to decode and rasterize
 * it. Re-encoding to a bounded JPEG keeps the same visual result at a fraction
 * of the size, which is what makes the details panel load fast.
 */
export async function downscaleImageFile(file: File, options: DownscaleOptions = {}): Promise<string> {
  const { maxEdge = DEFAULT_MAX_EDGE, quality = DEFAULT_QUALITY } = options;

  const dataUrl = await fileToDataUrl(file);
  if (file.size <= SMALL_ENOUGH_BYTES) return dataUrl;

  try {
    const image = await loadImage(dataUrl);
    const longestEdge = Math.max(image.width, image.height);
    if (!longestEdge) return dataUrl;

    const scale = Math.min(1, maxEdge / longestEdge);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    if (scale === 1) return dataUrl;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return dataUrl;

    // JPEG has no alpha channel; without this transparent PNGs turn black.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return dataUrl;
  }
}
