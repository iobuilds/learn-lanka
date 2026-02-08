import { useState, useRef } from 'react';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Upload as UploadIcon,
  X,
  Send,
  Loader2,
  Download,
  Youtube,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ClassPaper {
  id: string;
  class_id: string;
  title: string;
  paper_type: 'DAILY' | 'WEEKLY';
  description: string | null;
  pdf_url: string;
  review_video_url: string | null;
  answer_pdf_url: string | null;
  publish_status: 'DRAFT' | 'PUBLISHED';
  published_at: string | null;
  created_at: string;
}

interface ClassPapersManagerProps {
  classId: string;
  classTitle: string;
}

const ClassPapersManager = ({ classId, classTitle }: ClassPapersManagerProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const answerFileInputRef = useRef<HTMLInputElement>(null);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<ClassPaper | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [paperType, setPaperType] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [pdfUrl, setPdfUrl] = useState('');
  const [reviewVideoUrl, setReviewVideoUrl] = useState('');
  const [answerPdfUrl, setAnswerPdfUrl] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingAnswer, setUploadingAnswer] = useState(false);
  
  // Delete state
  const [deletePaper, setDeletePaper] = useState<ClassPaper | null>(null);
  
  // Publish confirm state
  const [publishPaper, setPublishPaper] = useState<ClassPaper | null>(null);

  // Fetch class papers
  const { data: papers = [], isLoading } = useQuery({
    queryKey: ['class-papers', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_papers')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ClassPaper[];
    },
    enabled: !!classId,
  });

  // Upload PDF
  const uploadPdfMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadingPdf(true);
      try {
        const fileName = `class-papers/${classId}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from('papers')
          .upload(fileName, file);
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('papers')
          .getPublicUrl(fileName);
        
        return publicUrl;
      } finally {
        setUploadingPdf(false);
      }
    },
    onSuccess: (url) => {
      setPdfUrl(url);
      toast.success('PDF uploaded!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload PDF');
    },
  });

  // Upload Answer PDF
  const uploadAnswerMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadingAnswer(true);
      try {
        const fileName = `class-papers/${classId}/answers/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from('papers')
          .upload(fileName, file);
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('papers')
          .getPublicUrl(fileName);
        
        return publicUrl;
      } finally {
        setUploadingAnswer(false);
      }
    },
    onSuccess: (url) => {
      setAnswerPdfUrl(url);
      toast.success('Answer PDF uploaded!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload answer PDF');
    },
  });

  // Save paper mutation
  const savePaperMutation = useMutation({
    mutationFn: async () => {
      if (editingPaper) {
        const { error } = await supabase
          .from('class_papers')
          .update({ 
            title, 
            description: description || null,
            paper_type: paperType,
            pdf_url: pdfUrl,
            review_video_url: reviewVideoUrl || null,
            answer_pdf_url: answerPdfUrl || null,
          })
          .eq('id', editingPaper.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('class_papers')
          .insert({
            class_id: classId,
            title,
            description: description || null,
            paper_type: paperType,
            pdf_url: pdfUrl,
            review_video_url: reviewVideoUrl || null,
            answer_pdf_url: answerPdfUrl || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-papers', classId] });
      setDialogOpen(false);
      resetForm();
      toast.success(editingPaper ? 'Paper updated!' : 'Paper created!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save paper');
    },
  });

  // Publish paper mutation
  const publishMutation = useMutation({
    mutationFn: async (paperId: string) => {
      const { error: paperError } = await supabase
        .from('class_papers')
        .update({ 
          publish_status: 'PUBLISHED',
          published_at: new Date().toISOString(),
        })
        .eq('id', paperId);
      if (paperError) throw paperError;

      const paper = papers.find(p => p.id === paperId);
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          target_type: 'CLASS',
          target_ref: classId,
          title: `New ${paper?.paper_type === 'DAILY' ? 'Daily' : 'Weekly'} Paper Available`,
          message: `"${paper?.title}" is now available for download in ${classTitle}.`,
        });
      if (notifError) console.error('Notification error:', notifError);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-papers', classId] });
      setPublishPaper(null);
      toast.success('Paper published and students notified!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to publish paper');
    },
  });

  // Delete paper mutation
  const deleteMutation = useMutation({
    mutationFn: async (paperId: string) => {
      const { error } = await supabase
        .from('class_papers')
        .delete()
        .eq('id', paperId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-papers', classId] });
      setDeletePaper(null);
      toast.success('Paper deleted!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete paper');
    },
  });

  const resetForm = () => {
    setEditingPaper(null);
    setTitle('');
    setDescription('');
    setPaperType('DAILY');
    setPdfUrl('');
    setReviewVideoUrl('');
    setAnswerPdfUrl('');
  };

  const openEditPaper = (paper: ClassPaper) => {
    setEditingPaper(paper);
    setTitle(paper.title);
    setDescription(paper.description || '');
    setPaperType(paper.paper_type);
    setPdfUrl(paper.pdf_url);
    setReviewVideoUrl(paper.review_video_url || '');
    setAnswerPdfUrl(paper.answer_pdf_url || '');
    setDialogOpen(true);
  };

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File size must be less than 20MB');
        return;
      }
      uploadPdfMutation.mutate(file);
    }
  };

  const handleAnswerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File size must be less than 20MB');
        return;
      }
      uploadAnswerMutation.mutate(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Daily/Weekly Papers</h2>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Paper
        </Button>
      </div>

      {papers.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-2">No papers yet</h3>
            <p className="text-sm text-muted-foreground">Add daily or weekly practice papers</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {papers.map((paper) => (
            <Card key={paper.id} className="card-elevated">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{paper.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline">
                        {paper.paper_type === 'DAILY' ? 'Daily' : 'Weekly'}
                      </Badge>
                      <Badge 
                        variant={paper.publish_status === 'PUBLISHED' ? 'default' : 'secondary'}
                      >
                        {paper.publish_status}
                      </Badge>
                      {paper.review_video_url && (
                        <Badge variant="outline" className="gap-1">
                          <Youtube className="w-3 h-3" />
                          Video
                        </Badge>
                      )}
                      {paper.answer_pdf_url && (
                        <Badge variant="outline" className="gap-1">
                          <Eye className="w-3 h-3" />
                          Answers
                        </Badge>
                      )}
                      {paper.published_at && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(paper.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {paper.publish_status === 'DRAFT' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setPublishPaper(paper)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Publish
                    </Button>
                  )}
                  <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost">
                      <Download className="w-4 h-4" />
                    </Button>
                  </a>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditPaper(paper)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeletePaper(paper)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Paper Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPaper ? 'Edit Paper' : 'Add Paper'}</DialogTitle>
            <DialogDescription>
              {editingPaper ? 'Update paper details' : 'Add a new practice paper for students'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                placeholder="e.g., Week 1 MCQ Paper"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea 
                id="description" 
                placeholder="Brief description..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Paper Type</Label>
              <Select value={paperType} onValueChange={(v) => setPaperType(v as 'DAILY' | 'WEEKLY')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily Paper</SelectItem>
                  <SelectItem value="WEEKLY">Weekly Paper</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Paper PDF */}
            <div className="space-y-2">
              <Label>Paper PDF</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPdf}
                >
                  <UploadIcon className="w-4 h-4 mr-2" />
                  {uploadingPdf ? 'Uploading...' : 'Choose PDF'}
                </Button>
                {pdfUrl && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <FileText className="w-3 h-3" />
                      Paper Uploaded
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setPdfUrl('')}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Answer PDF */}
            <div className="space-y-2">
              <Label>Answer Sheet PDF (optional - paid users only)</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={answerFileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleAnswerFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => answerFileInputRef.current?.click()}
                  disabled={uploadingAnswer}
                >
                  <UploadIcon className="w-4 h-4 mr-2" />
                  {uploadingAnswer ? 'Uploading...' : 'Choose Answer PDF'}
                </Button>
                {answerPdfUrl && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Eye className="w-3 h-3" />
                      Answers Uploaded
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setAnswerPdfUrl('')}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Only visible to students with paid monthly subscription</p>
            </div>

            {/* Review Video URL */}
            <div className="space-y-2">
              <Label htmlFor="reviewVideo">Review Video URL (optional - paid users only)</Label>
              <Input 
                id="reviewVideo" 
                placeholder="https://www.youtube.com/watch?v=..."
                value={reviewVideoUrl}
                onChange={(e) => setReviewVideoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Only visible to students with paid monthly subscription</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => savePaperMutation.mutate()}
              disabled={savePaperMutation.isPending || !title || !pdfUrl}
            >
              {savePaperMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Confirmation */}
      <AlertDialog open={!!publishPaper} onOpenChange={() => setPublishPaper(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Paper</AlertDialogTitle>
            <AlertDialogDescription>
              This will make "{publishPaper?.title}" available to all enrolled students and send them a notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => publishPaper && publishMutation.mutate(publishPaper.id)}
            >
              Publish & Notify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePaper} onOpenChange={() => setDeletePaper(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Paper</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletePaper?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletePaper && deleteMutation.mutate(deletePaper.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClassPapersManager;
