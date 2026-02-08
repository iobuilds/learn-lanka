import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Image as ImageIcon, 
  Check, 
  Type,
  Upload,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

const AdminRankPaperQuestions = () => {
  const { id: paperId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);
  const [uploadingOptionId, setUploadingOptionId] = useState<string | null>(null);

  // Fetch paper details
  const { data: paper } = useQuery({
    queryKey: ['rank-paper', paperId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_papers')
        .select('*')
        .eq('id', paperId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!paperId,
  });

  // Fetch questions
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['rank-mcq-questions', paperId],
    queryFn: async () => {
      const { data: questionsData, error: qError } = await supabase
        .from('rank_mcq_questions')
        .select('*')
        .eq('rank_paper_id', paperId)
        .order('q_no', { ascending: true });
      
      if (qError) throw qError;

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
    enabled: !!paperId,
  });

  // Add question mutation
  const addQuestionMutation = useMutation({
    mutationFn: async () => {
      const newQNo = questions.length + 1;
      
      const { data: question, error: qError } = await supabase
        .from('rank_mcq_questions')
        .insert({
          rank_paper_id: paperId,
          q_no: newQNo,
          question_text: '',
        })
        .select()
        .single();
      
      if (qError) throw qError;

      const optionsToInsert = [1, 2, 3, 4].map((no) => ({
        question_id: question.id,
        option_no: no,
        option_text: '',
        is_correct: no === 1,
      }));

      const { error: oError } = await supabase
        .from('rank_mcq_options')
        .insert(optionsToInsert);
      
      if (oError) throw oError;

      return question;
    },
    onSuccess: () => {
      toast.success('Question added!');
      queryClient.invalidateQueries({ queryKey: ['rank-mcq-questions', paperId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add question');
    },
  });

  // Update question text mutation
  const updateQuestionTextMutation = useMutation({
    mutationFn: async ({ id, question_text }: { id: string; question_text: string }) => {
      const { error } = await supabase
        .from('rank_mcq_questions')
        .update({ question_text })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rank-mcq-questions', paperId] });
    },
  });

  // Update question image mutation
  const updateQuestionImageMutation = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string | null }) => {
      const { error } = await supabase
        .from('rank_mcq_questions')
        .update({ question_image_url: url })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rank-mcq-questions', paperId] });
    },
  });

  // Update option text mutation
  const updateOptionTextMutation = useMutation({
    mutationFn: async ({ id, option_text }: { id: string; option_text: string }) => {
      const { error } = await supabase
        .from('rank_mcq_options')
        .update({ option_text })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rank-mcq-questions', paperId] });
    },
  });

  // Update option image mutation
  const updateOptionImageMutation = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string | null }) => {
      const { error } = await supabase
        .from('rank_mcq_options')
        .update({ option_image_url: url })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rank-mcq-questions', paperId] });
    },
  });

  // Set correct answer mutation
  const setCorrectAnswerMutation = useMutation({
    mutationFn: async ({ questionId, optionId }: { questionId: string; optionId: string }) => {
      await supabase
        .from('rank_mcq_options')
        .update({ is_correct: false })
        .eq('question_id', questionId);

      const { error } = await supabase
        .from('rank_mcq_options')
        .update({ is_correct: true })
        .eq('id', optionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Correct answer set!');
      queryClient.invalidateQueries({ queryKey: ['rank-mcq-questions', paperId] });
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('rank_mcq_options').delete().eq('question_id', id);
      const { error } = await supabase.from('rank_mcq_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Question deleted!');
      queryClient.invalidateQueries({ queryKey: ['rank-mcq-questions', paperId] });
    },
  });

  // Upload image handler
  const handleImageUpload = async (
    file: File,
    type: 'question' | 'option',
    id: string
  ) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    if (type === 'question') {
      setUploadingQuestionId(id);
    } else {
      setUploadingOptionId(id);
    }

    try {
      const fileName = `${paperId}/${type}-${id}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from('papers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('papers')
        .getPublicUrl(fileName);

      if (type === 'question') {
        await updateQuestionImageMutation.mutateAsync({ id, url: publicUrl });
      } else {
        await updateOptionImageMutation.mutateAsync({ id, url: publicUrl });
      }

      toast.success('Image uploaded!');
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploadingQuestionId(null);
      setUploadingOptionId(null);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/rank-papers')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Manage Questions</h1>
            <p className="text-muted-foreground">{paper?.title} - {questions.length} questions</p>
          </div>
          <Button onClick={() => addQuestionMutation.mutate()} disabled={addQuestionMutation.isPending}>
            {addQuestionMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Question
          </Button>
        </div>

        {/* Questions */}
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No questions yet. Add your first question to get started.</p>
              <Button onClick={() => addQuestionMutation.mutate()}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Question
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {questions.map((question) => (
              <Card key={question.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Badge>Q{question.q_no}</Badge>
                      Question {question.q_no}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteQuestionMutation.mutate(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Question Content */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Question (Text or Image)</Label>
                    
                    <Tabs defaultValue={question.question_image_url ? 'image' : 'text'} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 max-w-xs">
                        <TabsTrigger value="text" className="flex items-center gap-2">
                          <Type className="w-4 h-4" />
                          Text
                        </TabsTrigger>
                        <TabsTrigger value="image" className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Image
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="text" className="mt-3">
                        <Textarea
                          placeholder="Enter the question text..."
                          defaultValue={question.question_text || ''}
                          onBlur={(e) => {
                            if (e.target.value !== question.question_text) {
                              updateQuestionTextMutation.mutate({
                                id: question.id,
                                question_text: e.target.value,
                              });
                            }
                          }}
                          rows={3}
                        />
                      </TabsContent>
                      <TabsContent value="image" className="mt-3">
                        {question.question_image_url ? (
                          <div className="relative inline-block">
                            <img 
                              src={question.question_image_url} 
                              alt="Question" 
                              className="max-h-48 rounded-lg border"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => updateQuestionImageMutation.mutate({ id: question.id, url: null })}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                            {uploadingQuestionId === question.id ? (
                              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-sm text-muted-foreground">Click to upload question image</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, 'question', question.id);
                              }}
                            />
                          </label>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Options (click circle to mark correct answer)</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {question.options.map((option) => (
                        <div
                          key={option.id}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            option.is_correct 
                              ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                              : 'border-border'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => option.id && setCorrectAnswerMutation.mutate({
                                questionId: question.id,
                                optionId: option.id,
                              })}
                              className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                option.is_correct 
                                  ? 'border-green-500 bg-green-500 text-white' 
                                  : 'border-muted-foreground hover:border-primary'
                              }`}
                            >
                              {option.is_correct && <Check className="w-4 h-4" />}
                            </button>
                            <div className="flex-1 space-y-2">
                              <Badge variant="secondary" className="mb-2">
                                Option {String.fromCharCode(64 + option.option_no)}
                              </Badge>
                              
                              {option.option_image_url ? (
                                <div className="relative inline-block">
                                  <img 
                                    src={option.option_image_url} 
                                    alt={`Option ${option.option_no}`}
                                    className="max-h-24 rounded border"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-5 w-5"
                                    onClick={() => option.id && updateOptionImageMutation.mutate({ id: option.id, url: null })}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <Input
                                    placeholder={`Option ${String.fromCharCode(64 + option.option_no)} text`}
                                    defaultValue={option.option_text || ''}
                                    onBlur={(e) => {
                                      if (option.id && e.target.value !== option.option_text) {
                                        updateOptionTextMutation.mutate({
                                          id: option.id,
                                          option_text: e.target.value,
                                        });
                                      }
                                    }}
                                    className="flex-1"
                                  />
                                  <label className="cursor-pointer">
                                    {uploadingOptionId === option.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Button type="button" variant="outline" size="icon" asChild>
                                        <span>
                                          <ImageIcon className="w-4 h-4" />
                                        </span>
                                      </Button>
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file && option.id) handleImageUpload(file, 'option', option.id);
                                      }}
                                    />
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add More Button at Bottom */}
        {questions.length > 0 && (
          <div className="flex justify-center pt-4">
            <Button 
              size="lg" 
              onClick={() => addQuestionMutation.mutate()}
              disabled={addQuestionMutation.isPending}
            >
              {addQuestionMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add Another Question
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRankPaperQuestions;
