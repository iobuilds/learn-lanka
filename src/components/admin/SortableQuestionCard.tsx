import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Check, X, Upload, Loader2, Image as ImageIcon, Type, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
  isExpanded: boolean;
  onExpandChange: (isExpanded: boolean) => void;
  uploadingQuestionId: string | null;
  uploadingOptionId: string | null;
  onUpdateQuestionText: (id: string, text: string) => void;
  onUpdateQuestionImage: (id: string, url: string | null) => void;
  onUpdateOptionText: (id: string, text: string) => void;
  onUpdateOptionImage: (id: string, url: string | null) => void;
  onSetCorrectAnswer: (questionId: string, optionId: string) => void;
  onDeleteQuestion: (id: string) => void;
  onDuplicateQuestion: (question: MCQQuestion) => void;
  onImageUpload: (file: File, type: 'question' | 'option', id: string) => void;
}

const SortableQuestionCard = ({
  question,
  isExpanded,
  onExpandChange,
  uploadingQuestionId,
  uploadingOptionId,
  onUpdateQuestionText,
  onUpdateQuestionImage,
  onUpdateOptionText,
  onUpdateOptionImage,
  onSetCorrectAnswer,
  onDeleteQuestion,
  onDuplicateQuestion,
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

  const getQuestionPreview = () => {
    if (question.question_text) {
      return question.question_text.length > 60 
        ? question.question_text.substring(0, 60) + '...' 
        : question.question_text;
    }
    if (question.question_image_url) return '[Image question]';
    return '[Empty question]';
  };

  const correctOption = question.options.find(o => o.is_correct);
  const correctAnswer = correctOption 
    ? `Answer: ${String.fromCharCode(64 + correctOption.option_no)}`
    : '';

  return (
    <Card ref={setNodeRef} style={style} className="overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={onExpandChange}>
        <CardHeader className="bg-muted/50 py-2 px-4">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 flex-1 text-left hover:bg-muted/50 rounded p-1 -m-1">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <Badge variant="secondary" className="shrink-0">Q{question.q_no}</Badge>
                {!isExpanded && (
                  <span className="text-sm text-muted-foreground truncate flex-1">
                    {getQuestionPreview()}
                  </span>
                )}
                {!isExpanded && correctAnswer && (
                  <Badge variant="outline" className="text-green-600 shrink-0">
                    {correctAnswer}
                  </Badge>
                )}
              </button>
            </CollapsibleTrigger>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onDuplicateQuestion(question)}
                title="Duplicate question"
              >
                <Copy className="w-4 h-4" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Question {question.q_no}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this question and all its options. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeleteQuestion(question.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-4 space-y-4">
            {/* Question Content */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Question (Text or Image)</Label>
              
              <Tabs defaultValue={question.question_image_url ? 'image' : 'text'} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[200px] h-8">
                  <TabsTrigger value="text" className="text-xs flex items-center gap-1">
                    <Type className="w-3 h-3" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="image" className="text-xs flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    Image
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="mt-2">
                  <Textarea
                    placeholder="Enter the question text..."
                    defaultValue={question.question_text || ''}
                    onBlur={(e) => {
                      if (e.target.value !== question.question_text) {
                        onUpdateQuestionText(question.id, e.target.value);
                      }
                    }}
                    rows={2}
                    className="text-sm"
                  />
                </TabsContent>
                <TabsContent value="image" className="mt-2">
                  {question.question_image_url ? (
                    <div className="relative inline-block">
                      <img 
                        src={question.question_image_url} 
                        alt="Question" 
                        className="max-h-32 rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-5 w-5"
                        onClick={() => onUpdateQuestionImage(question.id, null)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      {uploadingQuestionId === question.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Upload image</span>
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
            <div className="space-y-2">
              <Label className="text-sm font-medium">Options (click circle to mark correct)</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className={`p-2 rounded-lg border transition-colors ${
                      option.is_correct 
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => option.id && onSetCorrectAnswer(question.id, option.id)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          option.is_correct 
                            ? 'border-green-500 bg-green-500 text-white' 
                            : 'border-muted-foreground hover:border-primary'
                        }`}
                      >
                        {option.is_correct && <Check className="w-3 h-3" />}
                      </button>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {String.fromCharCode(64 + option.option_no)}
                      </Badge>
                      
                      {option.option_image_url ? (
                        <div className="relative inline-block flex-1">
                          <img 
                            src={option.option_image_url} 
                            alt={`Option ${option.option_no}`}
                            className="max-h-16 rounded border"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-1 -right-1 h-4 w-4"
                            onClick={() => option.id && onUpdateOptionImage(option.id, null)}
                          >
                            <X className="w-2 h-2" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Input
                            placeholder={`Option ${String.fromCharCode(64 + option.option_no)}`}
                            defaultValue={option.option_text || ''}
                            onBlur={(e) => {
                              if (option.id && e.target.value !== option.option_text) {
                                onUpdateOptionText(option.id, e.target.value);
                              }
                            }}
                            className="flex-1 h-8 text-sm"
                          />
                          <label className="cursor-pointer shrink-0">
                            {uploadingOptionId === option.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" asChild>
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
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default SortableQuestionCard;
