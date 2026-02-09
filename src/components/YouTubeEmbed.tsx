import { cn } from '@/lib/utils';

interface YouTubeEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

// Extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
    /youtube\.com\/v\/([^&\s?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

const YouTubeEmbed = ({ url, title = 'Video', className }: YouTubeEmbedProps) => {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return (
      <div className={cn("aspect-video bg-muted rounded-lg flex items-center justify-center", className)}>
        <p className="text-sm text-muted-foreground">Invalid video URL</p>
      </div>
    );
  }

  return (
    <div className={cn("aspect-video rounded-lg overflow-hidden bg-black", className)}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
};

export default YouTubeEmbed;
