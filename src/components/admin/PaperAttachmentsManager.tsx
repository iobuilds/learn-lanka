import { useState } from 'react';
import { Plus, Trash2, Loader2, Video, FileText, ExternalLink, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Attachment {
  id: string;
  paper_id: string;
  attachment_type: string;
  title: string | null;
  url: string;
  sort_order: number;
  created_at: string;
}

interface PaperAttachmentsManagerProps {
  paperId: string;
  paperTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PaperAttachmentsManager = ({ paperId, paperTitle, open, onOpenChange }: PaperAttachmentsManagerProps) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form state
  const [attachmentType, setAttachmentType] = useState<string>('VIDEO');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  // Fetch attachments
  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['paper-attachments', paperId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('paper_attachments')
        .select('*')
        .eq('paper_id', paperId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Attachment[];
    },
    enabled: open,
  });

  // Add attachment mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = attachments.length > 0 
        ? Math.max(...attachments.map(a => a.sort_order)) 
        : 0;
      
      const { error } = await supabase
        .from('paper_attachments')
        .insert({
          paper_id: paperId,
          attachment_type: attachmentType,
          title: title || null,
          url,
          sort_order: maxOrder + 1,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Attachment added!');
      queryClient.invalidateQueries({ queryKey: ['paper-attachments', paperId] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add attachment');
    },
  });

  // Delete attachment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('paper_attachments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Attachment deleted!');
      queryClient.invalidateQueries({ queryKey: ['paper-attachments', paperId] });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete attachment');
    },
  });

  const resetForm = () => {
    setIsAdding(false);
    setAttachmentType('VIDEO');
    setTitle('');
    setUrl('');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Review Materials</DialogTitle>
            <DialogDescription>
              Add review videos and PDFs for: {paperTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Existing Attachments */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : attachments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No review materials added yet
              </div>
            ) : (
              <div className="space-y-3">
                {attachments.map((attachment) => (
                  <div 
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {attachment.attachment_type === 'VIDEO' ? (
                        <Video className="w-4 h-4 text-primary" />
                      ) : (
                        <FileText className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {attachment.title || (attachment.attachment_type === 'VIDEO' ? 'Review Video' : 'Review PDF')}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{attachment.url}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => window.open(
                          attachment.attachment_type === 'VIDEO' 
                            ? attachment.url 
                            : attachment.url, 
                          '_blank'
                        )}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(attachment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Attachment Form */}
            {isAdding ? (
              <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={attachmentType} onValueChange={setAttachmentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIDEO">
                          <span className="flex items-center gap-2">
                            <Video className="w-4 h-4" /> Review Video
                          </span>
                        </SelectItem>
                        <SelectItem value="PDF">
                          <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4" /> PDF Document
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title (optional)</Label>
                    <Input 
                      placeholder={attachmentType === 'VIDEO' ? 'e.g., Answer Explanation' : 'e.g., Marking Scheme'}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>
                    {attachmentType === 'VIDEO' ? 'YouTube URL' : 'PDF URL'} *
                  </Label>
                  <Input 
                    placeholder={attachmentType === 'VIDEO' 
                      ? 'https://youtube.com/watch?v=...' 
                      : 'https://...pdf'
                    }
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  {attachmentType === 'VIDEO' && (
                    <p className="text-xs text-muted-foreground">
                      Paste a YouTube video URL
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => addMutation.mutate()}
                    disabled={!url || addMutation.isPending}
                  >
                    {addMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Review Material
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attachment?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PaperAttachmentsManager;
