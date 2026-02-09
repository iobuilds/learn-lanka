import { Youtube, FileText, Image as ImageIcon, ExternalLink, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Attachment {
  id: string;
  attachment_type: 'youtube' | 'pdf' | 'image';
  title: string | null;
  url: string;
}

interface Props {
  lessonId: string;
  isPaid: boolean;
}

const LessonAttachmentsList = ({ lessonId, isPaid }: Props) => {
  const { session } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: attachments = [] } = useQuery({
    queryKey: ['lesson-attachments', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_attachments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Attachment[];
    },
    enabled: isPaid,
  });

  const handleDownloadPdf = async (attachment: Attachment) => {
    if (!session?.access_token) {
      toast.error('Please log in to download');
      return;
    }

    setDownloadingId(attachment.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-pdf-watermark`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ pdfUrl: attachment.url }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${attachment.title || 'document'}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF downloaded!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  if (!isPaid || attachments.length === 0) return null;

  const videos = attachments.filter(a => a.attachment_type === 'youtube');
  const pdfs = attachments.filter(a => a.attachment_type === 'pdf');
  const images = attachments.filter(a => a.attachment_type === 'image');

  return (
    <div className="mt-3 space-y-2">
      {/* Videos */}
      {videos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {videos.map((video) => (
            <Button
              key={video.id}
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => window.open(video.url, '_blank')}
            >
              <Youtube className="w-4 h-4 text-destructive" />
              {video.title || 'Watch Video'}
            </Button>
          ))}
        </div>
      )}

      {/* PDFs */}
      {pdfs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pdfs.map((pdf) => (
            <Button
              key={pdf.id}
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => handleDownloadPdf(pdf)}
              disabled={downloadingId === pdf.id}
            >
              {downloadingId === pdf.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 text-primary" />
              )}
              {pdf.title || 'PDF'}
              <Download className="w-3 h-3" />
            </Button>
          ))}
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((image) => (
            <Button
              key={image.id}
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => window.open(image.url, '_blank')}
            >
              <ImageIcon className="w-4 h-4 text-accent" />
              {image.title || 'View Image'}
              <ExternalLink className="w-3 h-3" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LessonAttachmentsList;
