import { useState } from 'react';
import { Loader2, FileText, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  paperId: string;
  maxQuestions: number;
  currentCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const BulkAddQuestionsDialog = ({ paperId, maxQuestions, currentCount, open, onOpenChange }: Props) => {
  const queryClient = useQueryClient();
  const [bulkText, setBulkText] = useState('');

  // Helper to get current max q_no from database (avoids stale state race conditions)
  const fetchMaxQNo = async (): Promise<number> => {
    const { data, error } = await supabase
      .from('rank_mcq_questions')
      .select('q_no')
      .eq('rank_paper_id', paperId)
      .order('q_no', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0].q_no : 0;
  };

  const exampleFormat = `1. What is the capital of Sri Lanka?
A) Kandy
B) Colombo*
C) Galle
D) Jaffna

2. Which is a programming language?
A) HTML
B) CSS
C) Python*
D) SQL`;

  // Parse the bulk text into questions
  const parseQuestions = (text: string): ParsedQuestion[] => {
    const questions: ParsedQuestion[] = [];
    
    // Split by question numbers (1. 2. 3. etc) or double newlines
    const blocks = text.split(/\n\s*\n/).filter(b => b.trim());
    
    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 3) continue; // Need at least question + 2 options
      
      // First line is the question (remove leading number if present)
      let questionText = lines[0].replace(/^\d+[\.\)]\s*/, '').trim();
      
      // Parse options
      const options: string[] = [];
      let correctIndex = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Match patterns like: A) option, A. option, a) option, 1) option, etc.
        const optionMatch = line.match(/^[A-Da-d1-4][\.\)]\s*(.+)$/);
        if (optionMatch) {
          let optionText = optionMatch[1].trim();
          // Check for correct answer marker (*)
          if (optionText.endsWith('*')) {
            correctIndex = options.length;
            optionText = optionText.slice(0, -1).trim();
          }
          options.push(optionText);
        }
      }
      
      // Only add if we have a question and at least 2 options
      if (questionText && options.length >= 2) {
        // Pad options to 4 if needed
        while (options.length < 4) {
          options.push('');
        }
        questions.push({
          question: questionText,
          options: options.slice(0, 4), // Max 4 options
          correctIndex: Math.min(correctIndex, 3),
        });
      }
    }
    
    return questions;
  };

  const bulkAddMutation = useMutation({
    mutationFn: async () => {
      const parsed = parseQuestions(bulkText);
      
      if (parsed.length === 0) {
        throw new Error('No valid questions found. Please check the format.');
      }

      // Check room for new questions
      const remaining = maxQuestions - currentCount;
      if (parsed.length > remaining) {
        throw new Error(`Only ${remaining} more question${remaining !== 1 ? 's' : ''} allowed (max ${maxQuestions}).`);
      }

      // Get fresh max q_no from database
      let currentQNo = (await fetchMaxQNo()) + 1;

      for (const q of parsed) {
        if (currentQNo > maxQuestions) {
          throw new Error(`Question number would exceed ${maxQuestions}. Delete some questions first.`);
        }

        // Create question
        const { data: question, error: qError } = await supabase
          .from('rank_mcq_questions')
          .insert({
            rank_paper_id: paperId,
            q_no: currentQNo,
            question_text: q.question,
          })
          .select()
          .single();
        
        if (qError) throw qError;

        // Create options
        const optionsToInsert = q.options.map((text, idx) => ({
          question_id: question.id,
          option_no: idx + 1,
          option_text: text,
          is_correct: idx === q.correctIndex,
        }));

        const { error: oError } = await supabase
          .from('rank_mcq_options')
          .insert(optionsToInsert);
        
        if (oError) throw oError;
        
        currentQNo++;
      }

      return parsed.length;
    },
    onSuccess: (count) => {
      toast.success(`Added ${count} questions!`);
      queryClient.invalidateQueries({ queryKey: ['rank-mcq-questions', paperId] });
      setBulkText('');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add questions');
    },
  });

  const previewCount = parseQuestions(bulkText).length;
  const remaining = maxQuestions - currentCount;
  const exceedsLimit = previewCount > remaining;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Bulk Add Questions
          </DialogTitle>
          <DialogDescription>
            Paste multiple questions at once. Mark correct answers with * at the end.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Questions Text</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1">
                    <HelpCircle className="w-4 h-4 mr-1" />
                    Format Help
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Example Format:</p>
                    <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">
{exampleFormat}
                    </pre>
                    <p className="text-xs text-muted-foreground">
                      • Separate questions with blank lines<br/>
                      • Use A) B) C) D) for options<br/>
                      • Add * after correct answer
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Textarea
              placeholder={`Paste your questions here...\n\nExample:\n${exampleFormat}`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          {bulkText && (
            <div className={`p-3 rounded-lg ${exceedsLimit ? 'bg-destructive/10 border border-destructive/50' : 'bg-muted'}`}>
              <p className="text-sm">
                <span className="font-medium">{previewCount}</span> question{previewCount !== 1 ? 's' : ''} detected
                {exceedsLimit ? (
                  <span className="text-destructive ml-1">— exceeds limit! Only {remaining} more allowed.</span>
                ) : (
                  remaining < maxQuestions && (
                    <span className="text-muted-foreground"> ({remaining} spots remaining)</span>
                  )
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => bulkAddMutation.mutate()}
            disabled={bulkAddMutation.isPending || previewCount === 0 || exceedsLimit}
          >
            {bulkAddMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              `Add ${previewCount} Question${previewCount !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkAddQuestionsDialog;
