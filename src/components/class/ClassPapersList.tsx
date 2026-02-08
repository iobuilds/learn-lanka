import { useState } from 'react';
import { FileText, Download, Loader2, Youtube, Eye, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ClassPaper {
  id: string;
  title: string;
  paper_type: 'DAILY' | 'WEEKLY';
  description: string | null;
  pdf_url: string;
  review_video_url: string | null;
  answer_pdf_url: string | null;
  published_at: string | null;
}

interface ClassPapersListProps {
  classId: string;
  isPaid: boolean;
}

const ClassPapersList = ({ classId, isPaid }: ClassPapersListProps) => {
  const { session } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAnswerId, setDownloadingAnswerId] = useState<string | null>(null);

  // Fetch published class papers
  const { data: papers = [], isLoading } = useQuery({
    queryKey: ['class-papers-student', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_papers')
        .select('id, title, paper_type, description, pdf_url, review_video_url, answer_pdf_url, published_at')
        .eq('class_id', classId)
        .eq('publish_status', 'PUBLISHED')
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data as ClassPaper[];
    },
    enabled: !!classId,
  });

  // Download with watermark (name only)
  const handleDownload = async (paper: ClassPaper) => {
    if (!session?.access_token) {
      toast.error('Please log in to download');
      return;
    }

    setDownloadingId(paper.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-class-paper`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ pdfUrl: paper.pdf_url }),
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
      a.download = `${paper.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Paper downloaded!');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download');
    } finally {
      setDownloadingId(null);
    }
  };

  // Download answer sheet with watermark
  const handleDownloadAnswer = async (paper: ClassPaper) => {
    if (!isPaid) {
      toast.error('Monthly payment required to access answers');
      return;
    }
    if (!session?.access_token || !paper.answer_pdf_url) return;

    setDownloadingAnswerId(paper.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-class-paper`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ pdfUrl: paper.answer_pdf_url }),
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
      a.download = `${paper.title.replace(/[^a-zA-Z0-9]/g, '_')}_answers.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Answer sheet downloaded!');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download');
    } finally {
      setDownloadingAnswerId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <Card className="card-elevated">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-medium text-foreground mb-2">No papers available</h3>
          <p className="text-sm text-muted-foreground">Practice papers will appear here</p>
        </CardContent>
      </Card>
    );
  }

  // Group by type
  const dailyPapers = papers.filter(p => p.paper_type === 'DAILY');
  const weeklyPapers = papers.filter(p => p.paper_type === 'WEEKLY');

  return (
    <div className="space-y-6">
      {/* Daily Papers */}
      {dailyPapers.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Daily Papers</h3>
          <div className="grid gap-3">
            {dailyPapers.map((paper) => (
              <PaperCard 
                key={paper.id} 
                paper={paper} 
                onDownload={handleDownload}
                onDownloadAnswer={handleDownloadAnswer}
                isDownloading={downloadingId === paper.id}
                isDownloadingAnswer={downloadingAnswerId === paper.id}
                isPaid={isPaid}
              />
            ))}
          </div>
        </div>
      )}

      {/* Weekly Papers */}
      {weeklyPapers.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Weekly Papers</h3>
          <div className="grid gap-3">
            {weeklyPapers.map((paper) => (
              <PaperCard 
                key={paper.id} 
                paper={paper} 
                onDownload={handleDownload}
                onDownloadAnswer={handleDownloadAnswer}
                isDownloading={downloadingId === paper.id}
                isDownloadingAnswer={downloadingAnswerId === paper.id}
                isPaid={isPaid}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PaperCard = ({ 
  paper, 
  onDownload,
  onDownloadAnswer,
  isDownloading,
  isDownloadingAnswer,
  isPaid
}: { 
  paper: ClassPaper; 
  onDownload: (paper: ClassPaper) => void;
  onDownloadAnswer: (paper: ClassPaper) => void;
  isDownloading: boolean;
  isDownloadingAnswer: boolean;
  isPaid: boolean;
}) => (
  <Card className="card-elevated">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{paper.title}</p>
            {paper.description && (
              <p className="text-sm text-muted-foreground">{paper.description}</p>
            )}
            {paper.published_at && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(paper.published_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <Button 
          size="sm"
          onClick={() => onDownload(paper)}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download
            </>
          )}
        </Button>
      </div>

      {/* Review materials - only for paid users */}
      {(paper.review_video_url || paper.answer_pdf_url) && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Review Materials</p>
          <div className="flex flex-wrap gap-2">
            {paper.review_video_url && (
              isPaid ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(paper.review_video_url!, '_blank')}
                >
                  <Youtube className="w-4 h-4 mr-2 text-destructive" />
                  Watch Review
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  <Lock className="w-4 h-4 mr-2" />
                  Video (Paid Only)
                </Button>
              )
            )}
            {paper.answer_pdf_url && (
              isPaid ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDownloadAnswer(paper)}
                  disabled={isDownloadingAnswer}
                >
                  {isDownloadingAnswer ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Answer Sheet
                    </>
                  )}
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  <Lock className="w-4 h-4 mr-2" />
                  Answers (Paid Only)
                </Button>
              )
            )}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

export default ClassPapersList;
