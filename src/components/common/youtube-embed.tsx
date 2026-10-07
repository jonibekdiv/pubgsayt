import { extractYouTubeId } from '@/lib/utils';

export function YouTubeEmbed({ url, title }: { url:string; title?:string }) {
  const id = extractYouTubeId(url);
  if (!id) return <div className="flex aspect-video items-center justify-center rounded-2xl border border-line bg-bg-panel text-sm text-ink-faint">Invalid YouTube URL</div>;
  return <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-black">
    <iframe src={'https://www.youtube.com/embed/' + id} title={title ?? 'YouTube'}
      className="absolute inset-0 h-full w-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen loading="lazy"/>
  </div>;
}