import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Check, X, Upload, Loader2, Image as ImageIcon, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface SortableQuestionCardProps {
  question: MCQQuestion;
  uploadingQuestionId: string | null;
  uploadingOptionId: string | null;
  onUpdateQuestionText: (id: string, text: string) => void;
  onUpdateQuestionImage: (id: string, url: string | null) => void;
  onUpdateOptionText: (id: string, text: string) => void;
  onUpdateOptionImage: (id: string, url: string | null) => void;
  onSetCorrectAnswer: (questionId: string, optionId: string) => void;
  onDeleteQuestion: (id: string) => void;
  onImageUpload: (file: File, type: 'question' | 'option', id: string) => void;
}

const SortableQuestionCard = ({
  question,
  uploadingQuestionId,
  uploadingOptionId,
  onUpdateQuestionText,
  onUpdateQuestionImage,
  onUpdateOptionText,
  onUpdateOptionImage,
  onSetCorrectAnswer,
  onDeleteQuestion,
  onImageUpload,
}: SortableQuestionCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="overflow-hidden">
      <CardHeader className="bg-muted/50 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </button>
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge>Q{question.q_no}</Badge>
              Question {question.q_no}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDeleteQuestion(question.id)}
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
                    onUpdateQuestionText(question.id, e.target.value);
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
                    onClick={() => onUpdateQuestionImage(question.id, null)}
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
                      if (file) onImageUpload(file, 'question', question.id);
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
                    onClick={() => option.id && onSetCorrectAnswer(question.id, option.id)}
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
                          onClick={() => option.id && onUpdateOptionImage(option.id, null)}
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
                              onUpdateOptionText(option.id, e.target.value);
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
                              if (file && option.id) onImageUpload(file, 'option', option.id);
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
  );
};

export default SortableQuestionCard;
