/**
 * Client-side image processing:
 * - Resize to max dimensions
 * - Compress to target quality
 * - Convert to WebP if supported
 */

export interface CompressOptions {
  /** Max width in pixels */
  maxWidth?: number;
  /** Max height in pixels */
  maxHeight?: number;
  /** JPEG/WebP quality 0..1 */
  quality?: number;
  /** Output format — 'auto' picks WebP if supported */
  format?: 'auto' | 'image/jpeg' | 'image/png' | 'image/webp';
  /** Max output size in bytes (approximate, iterates quality) */
  maxBytes?: number;
}

export interface CompressResult {
  dataUrl: string;
  originalBytes: number;
  compressedBytes: number;
  width: number;
  height: number;
  format: string;
  ratio: number;
}

const DEFAULT_OPTS: Required<CompressOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.85,
  format: 'auto',
  maxBytes: 400 * 1024, // 400 KB
};

function supportsWebP(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

let webpSupported: boolean | null = null;
function isWebPSupported(): boolean {
  if (webpSupported === null) webpSupported = supportsWebP();
  return webpSupported;
}

function loadImage(file: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    if (typeof file === 'string') {
      img.src = file;
    } else {
      const reader = new FileReader();
      reader.onload = () => { img.src = reader.result as string; };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    }
  });
}

function dataUrlBytes(dataUrl: string): number {
  // Approximate: base64 string length × 0.75 minus header
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.floor(base64.length * 0.75);
}

/**
 * Compress and resize an image file.
 * Returns a data URL ready for localStorage.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const opts = { ...DEFAULT_OPTS, ...options };

  const img = await loadImage(file);
  const originalBytes = file.size;

  // Compute new dimensions preserving aspect ratio
  let width = img.naturalWidth;
  let height = img.naturalHeight;

  if (width > opts.maxWidth || height > opts.maxHeight) {
    const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Prepare canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Determine format
  let format = opts.format;
  if (format === 'auto') {
    format = isWebPSupported() ? 'image/webp' : 'image/jpeg';
  }

  // PNG keeps transparency — no quality param
  const isPng = format === 'image/png';
  let quality = isPng ? 1 : opts.quality;

  let dataUrl = canvas.toDataURL(format, quality);
  let compressedBytes = dataUrlBytes(dataUrl);

  // Iteratively reduce quality if too large
  let attempts = 0;
  while (
    compressedBytes > opts.maxBytes &&
    !isPng &&
    quality > 0.4 &&
    attempts < 5
  ) {
    quality = Math.max(0.4, quality - 0.15);
    dataUrl = canvas.toDataURL(format, quality);
    compressedBytes = dataUrlBytes(dataUrl);
    attempts++;
  }

  // If still too large, downsize further
  if (compressedBytes > opts.maxBytes && !isPng) {
    const shrink = Math.sqrt(opts.maxBytes / compressedBytes);
    const newW = Math.max(200, Math.round(width * shrink));
    const newH = Math.max(200, Math.round(height * shrink));
    canvas.width = newW;
    canvas.height = newH;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, newW, newH);
    dataUrl = canvas.toDataURL(format, 0.75);
    compressedBytes = dataUrlBytes(dataUrl);
    width = newW;
    height = newH;
  }

  return {
    dataUrl,
    originalBytes,
    compressedBytes,
    width,
    height,
    format: format.replace('image/', '').toUpperCase(),
    ratio: originalBytes > 0 ? compressedBytes / originalBytes : 1,
  };
}

/** Predefined size presets */
export const PRESETS = {
  avatar: { maxWidth: 256, maxHeight: 256, quality: 0.85, maxBytes: 80 * 1024 },
  logo: { maxWidth: 512, maxHeight: 512, quality: 0.88, maxBytes: 150 * 1024 },
  banner: { maxWidth: 1600, maxHeight: 640, quality: 0.82, maxBytes: 350 * 1024 },
} as const satisfies Record<string, CompressOptions>;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}