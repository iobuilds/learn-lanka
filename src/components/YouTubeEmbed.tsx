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

  // Use privacy-enhanced mode and disable related videos/sharing
  // modestbranding=1 hides YouTube logo, rel=0 disables related videos
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;

  return (
    <div 
      className={cn("aspect-video rounded-lg overflow-hidden bg-black", className)}
      onContextMenu={(e) => e.preventDefault()} // Disable right-click
    >
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
        style={{ border: 0 }}
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
};

export default YouTubeEmbed;
