import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, GripVertical, Image, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RankPaper {
  id: string;
  title: string;
  has_mcq: boolean;
}

interface MCQOption {
  id?: string;
  option_no: number;
  option_text: string | null;
  option_image_url: string | null;
  is_correct: boolean;
}

interface MCQQuestion {
  id: string;
  q_no: number;
  question_text: string | null;
  question_image_url: string | null;
  options: MCQOption[];
}

interface Props {
  paper: RankPaper | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RankPaperQuestionsDialog = ({ paper, open, onOpenChange }: Props) => {
  const queryClient = useQueryClient();
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Fetch existing questions
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['rank-mcq-questions', paper?.id],
    queryFn: async () => {
      if (!paper?.id) return [];
      
      const { data: questionsData, error: qError } = await supabase
        .from('rank_mcq_questions')
        .select('*')
        .eq('rank_paper_id', paper.id)
        .order('q_no', { ascending: true });
      
      if (qError) throw qError;

      // Fetch options for each question
      const questionsWithOptions = await Promise.all(
        questionsData.map(async (q) => {
          const { data: options } = await supabase
            .from('rank_mcq_options')
            .select('*')
            .eq('question_id', q.id)
            .order('option_no', { ascending: true });
          
          return { ...q, options: options || [] };
        })
      );

      return questionsWithOptions as MCQQuestion[];
    },
    enabled: !!paper?.id && open,
  });

  // Add new question mutation
  const addQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!paper?.id) throw new Error('No paper selected');
      
      const newQNo = questions.length + 1;
      
      // Create question
      const { data: question, error: qError } = await supabase
        .from('rank_mcq_questions')
        .insert({
          rank_paper_id: paper.id,
          q_no: newQNo,
          question_text: '',
        })
        .select()
        .single();
      
      if (qError) throw qError;

      // Create 4 default options
      const optionsToInsert = [1, 2, 3, 4].map((no) => ({
        question_id: question.id,
        option_no: no,
        option_text: '',
        is_correct: no === 1, // First option is correct by default
      }));

      const { error: oError } = await supabase
        .from('rank_mcq_options')
        .insert(optionsToInsert);
      
      if (oError) throw oError;

      return question;
    },
    onSuccess: (question) => {
      toast.success('Question added!');
      queryClient.invalidateQueries({ queryKey: ['rank-mcq-questions', paper?.id] });
      setExpandedQuestion(question.id);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add question');
    },
  });

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, question_text }: { id: string; question_text: string }) => {
      const { error } = await supabase
        .from('rank_mcq_questions')
        .update({ question_text })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rank-mcq-questions', paper?.id] });
    },
  });

  // Update option mutation
  const updateOptionMutation = useMutation({
    mutationFn: async ({ id, option_text }: { id: string; option_text: string }) => {
      const { error } = await supabase
        .from('rank_mcq_options')
        .update({ option_text })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rank-mcq-questions', paper?.id] });
    },
  });

  // Set correct answer mutation
  const setCorrectAnswerMutation = useMutation({
    mutationFn: async ({ questionId, optionId }: { questionId: string; optionId: string }) => {
      // First, set all options for this question to not correct
      const { error: resetError } = await supabase
        .from('rank_mcq_options')
        .update({ is_correct: false })
        .eq('question_id', questionId);
      
      if (resetError) throw resetError;

      // Then set the selected option as correct
      const { error } = await supabase
        .from('rank_mcq_options')
        .update({ is_correct: true })
        .eq('id', optionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Correct answer updated!');
      queryClient.invalidateQueries({ queryKey: ['rank-mcq-questions', paper?.id] });
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete options first (cascade should handle this, but being explicit)
      await supabase.from('rank_mcq_options').delete().eq('question_id', id);
      
      const { error } = await supabase
        .from('rank_mcq_questions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Question deleted!');
      queryClient.invalidateQueries({ queryKey: ['rank-mcq-questions', paper?.id] });
    },
  });

  if (!paper) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage MCQ Questions</DialogTitle>
          <DialogDescription>
            {paper.title} - {questions.length} question{questions.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 pr-4">
                {questions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No questions yet. Add your first question to get started.</p>
                  </div>
                ) : (
                  <Accordion 
                    type="single" 
                    collapsible 
                    value={expandedQuestion || undefined}
                    onValueChange={(val) => setExpandedQuestion(val || null)}
                    className="space-y-2"
                  >
                    {questions.map((question, index) => (
                      <AccordionItem 
                        key={question.id} 
                        value={question.id}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <Badge variant="outline" className="shrink-0">Q{question.q_no}</Badge>
                            <span className="line-clamp-1">
                              {question.question_text || 'Untitled question'}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4 space-y-4">
                          {/* Question Text */}
                          <div className="space-y-2">
                            <Label>Question Text</Label>
                            <Textarea
                              placeholder="Enter the question..."
                              defaultValue={question.question_text || ''}
                              onBlur={(e) => {
                                if (e.target.value !== question.question_text) {
                                  updateQuestionMutation.mutate({
                                    id: question.id,
                                    question_text: e.target.value,
                                  });
                                }
                              }}
                              rows={2}
                            />
                          </div>

                          {/* Options */}
                          <div className="space-y-2">
                            <Label>Options (click radio to mark correct answer)</Label>
                            <div className="space-y-2">
                              {question.options.map((option) => (
                                <div 
                                  key={option.id} 
                                  className={`flex items-center gap-2 p-2 rounded-lg border ${
                                    option.is_correct ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => option.id && setCorrectAnswerMutation.mutate({
                                      questionId: question.id,
                                      optionId: option.id,
                                    })}
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                      option.is_correct 
                                        ? 'border-green-500 bg-green-500 text-white' 
                                        : 'border-muted-foreground hover:border-primary'
                                    }`}
                                  >
                                    {option.is_correct && <Check className="w-3 h-3" />}
                                  </button>
                                  <Badge variant="secondary" className="shrink-0">
                                    {String.fromCharCode(64 + option.option_no)}
                                  </Badge>
                                  <Input
                                    placeholder={`Option ${option.option_no}`}
                                    defaultValue={option.option_text || ''}
                                    onBlur={(e) => {
                                      if (option.id && e.target.value !== option.option_text) {
                                        updateOptionMutation.mutate({
                                          id: option.id,
                                          option_text: e.target.value,
                                        });
                                      }
                                    }}
                                    className="flex-1"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Delete Button */}
                          <div className="flex justify-end pt-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteQuestionMutation.mutate(question.id)}
                              disabled={deleteQuestionMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Question
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </ScrollArea>

              {/* Add Question Button */}
              <div className="pt-4 border-t mt-4">
                <Button
                  onClick={() => addQuestionMutation.mutate()}
                  disabled={addQuestionMutation.isPending}
                  className="w-full"
                >
                  {addQuestionMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add Question
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RankPaperQuestionsDialog;
