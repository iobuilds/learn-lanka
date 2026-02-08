import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Calendar,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
  Youtube,
  FileText,
  Upload as UploadIcon,
  X,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/layouts/AdminLayout';
import ClassPapersManager from '@/components/admin/ClassPapersManager';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const AdminClassContent = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // Day dialog state
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<any>(null);
  const [dayTitle, setDayTitle] = useState('');
  const [dayDate, setDayDate] = useState('');
  const [dayIsExtra, setDayIsExtra] = useState(false);
  
  // Lesson dialog state
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [lessonDayId, setLessonDayId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonNotes, setLessonNotes] = useState('');
  const [lessonPdfUrl, setLessonPdfUrl] = useState('');
  const [lessonYoutubeUrl, setLessonYoutubeUrl] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  
  // Delete state
  const [deleteDay, setDeleteDay] = useState<any>(null);
  const [deleteLesson, setDeleteLesson] = useState<any>(null);

  // Fetch class details
  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch or create class month
  const { data: classMonth } = useQuery({
    queryKey: ['class-month', id, selectedMonth],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('class_months')
        .select('*')
        .eq('class_id', id)
        .eq('year_month', selectedMonth)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch class days
  const { data: classDays = [] } = useQuery({
    queryKey: ['class-days', classMonth?.id],
    queryFn: async () => {
      if (!classMonth) return [];
      const { data, error } = await supabase
        .from('class_days')
        .select('*')
        .eq('class_month_id', classMonth.id)
        .order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!classMonth,
  });

  // Fetch lessons
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', classDays.map(d => d.id)],
    queryFn: async () => {
      if (classDays.length === 0) return [];
      const dayIds = classDays.map(d => d.id);
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .in('class_day_id', dayIds)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: classDays.length > 0,
  });

  // Create class month mutation
  const createMonthMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('No class ID');
      const { data, error } = await supabase
        .from('class_months')
        .insert({ class_id: id, year_month: selectedMonth })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-month', id, selectedMonth] });
      toast.success('Month created!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create month');
    },
  });

  // Day mutations
  const saveDayMutation = useMutation({
    mutationFn: async () => {
      if (!classMonth) throw new Error('No class month');
      if (editingDay) {
        const { error } = await supabase
          .from('class_days')
          .update({ title: dayTitle, date: dayDate, is_extra: dayIsExtra })
          .eq('id', editingDay.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('class_days')
          .insert({ 
            class_month_id: classMonth.id, 
            title: dayTitle, 
            date: dayDate, 
            is_extra: dayIsExtra 
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-days'] });
      setDayDialogOpen(false);
      resetDayForm();
      toast.success(editingDay ? 'Day updated!' : 'Day added!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save day');
    },
  });

  const deleteDayMutation = useMutation({
    mutationFn: async (dayId: string) => {
      const { error } = await supabase.from('class_days').delete().eq('id', dayId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-days'] });
      setDeleteDay(null);
      toast.success('Day deleted!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete day');
    },
  });

  // Upload PDF mutation
  const uploadPdfMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadingPdf(true);
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('lesson-materials')
          .upload(fileName, file);
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('lesson-materials')
          .getPublicUrl(fileName);
        
        return publicUrl;
      } finally {
        setUploadingPdf(false);
      }
    },
    onSuccess: (url) => {
      setLessonPdfUrl(url);
      toast.success('PDF uploaded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload PDF');
    },
  });

  // Lesson mutations
  const saveLessonMutation = useMutation({
    mutationFn: async () => {
      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update({ 
            title: lessonTitle, 
            description: lessonDescription,
            notes_text: lessonNotes || null,
            pdf_url: lessonPdfUrl || null,
            youtube_url: lessonYoutubeUrl || null,
          })
          .eq('id', editingLesson.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert({ 
            class_day_id: lessonDayId,
            title: lessonTitle, 
            description: lessonDescription,
            notes_text: lessonNotes || null,
            pdf_url: lessonPdfUrl || null,
            youtube_url: lessonYoutubeUrl || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setLessonDialogOpen(false);
      resetLessonForm();
      toast.success(editingLesson ? 'Lesson updated!' : 'Lesson added!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save lesson');
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setDeleteLesson(null);
      toast.success('Lesson deleted!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete lesson');
    },
  });

  const resetDayForm = () => {
    setEditingDay(null);
    setDayTitle('');
    setDayDate('');
    setDayIsExtra(false);
  };

  const resetLessonForm = () => {
    setEditingLesson(null);
    setLessonDayId('');
    setLessonTitle('');
    setLessonDescription('');
    setLessonNotes('');
    setLessonPdfUrl('');
    setLessonYoutubeUrl('');
  };

  const openEditDay = (day: any) => {
    setEditingDay(day);
    setDayTitle(day.title);
    setDayDate(day.date);
    setDayIsExtra(day.is_extra);
    setDayDialogOpen(true);
  };

  const openAddLesson = (dayId: string) => {
    resetLessonForm();
    setLessonDayId(dayId);
    setLessonDialogOpen(true);
  };

  const openEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setLessonDayId(lesson.class_day_id);
    setLessonTitle(lesson.title);
    setLessonDescription(lesson.description || '');
    setLessonNotes(lesson.notes_text || '');
    setLessonPdfUrl(lesson.pdf_url || '');
    setLessonYoutubeUrl(lesson.youtube_url || '');
    setLessonDialogOpen(true);
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

  const getLessonsForDay = (dayId: string) => lessons.filter(l => l.class_day_id === dayId);

  if (classLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!classData) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-4">Class not found</h2>
          <Link to="/admin/classes">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Classes
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link to="/admin/classes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Classes
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{classData.title}</h1>
              <p className="text-muted-foreground">Manage schedule and lessons</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
        </div>

        {/* Month Status */}
        {!classMonth ? (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">No schedule for this month</h3>
              <p className="text-sm text-muted-foreground mb-4">Create a month to start adding class days</p>
              <Button onClick={() => createMonthMutation.mutate()} disabled={createMonthMutation.isPending}>
                {createMonthMutation.isPending ? 'Creating...' : 'Create Month'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="schedule" className="space-y-6">
            <TabsList>
              <TabsTrigger value="schedule" className="gap-2">
                <Calendar className="w-4 h-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="lessons" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Lessons
              </TabsTrigger>
              <TabsTrigger value="papers" className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Papers
              </TabsTrigger>
            </TabsList>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Class Days</h2>
                <Button onClick={() => { resetDayForm(); setDayDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Day
                </Button>
              </div>

              {classDays.length === 0 ? (
                <Card className="card-elevated">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-foreground mb-2">No class days yet</h3>
                    <p className="text-sm text-muted-foreground">Add your first class day to get started</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {classDays.map((day, index) => (
                    <Card key={day.id} className={cn("card-elevated", day.is_extra && "border-accent/50")}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="font-bold text-primary">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{day.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(day.date).toLocaleDateString('en-US', { 
                                weekday: 'long', month: 'short', day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {day.is_extra && (
                            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                              Extra
                            </Badge>
                          )}
                          <Badge variant="secondary">
                            {getLessonsForDay(day.id).length} lessons
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openAddLesson(day.id)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Lesson
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDay(day)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Day
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setDeleteDay(day)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Day
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Lessons Tab */}
            <TabsContent value="lessons" className="space-y-4">
              <h2 className="text-lg font-semibold">All Lessons</h2>

              {lessons.length === 0 ? (
                <Card className="card-elevated">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-foreground mb-2">No lessons yet</h3>
                    <p className="text-sm text-muted-foreground">Add class days first, then add lessons</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {classDays.map((day) => {
                    const dayLessons = getLessonsForDay(day.id);
                    if (dayLessons.length === 0) return null;
                    return (
                      <div key={day.id}>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">{day.title}</h3>
                        <div className="grid gap-3">
                          {dayLessons.map((lesson) => (
                            <Card key={lesson.id} className="card-elevated">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-foreground">{lesson.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      {lesson.pdf_url && (
                                        <Badge variant="outline" className="gap-1">
                                          <FileText className="w-3 h-3" />
                                          PDF
                                        </Badge>
                                      )}
                                      {lesson.youtube_url && (
                                        <Badge variant="outline" className="gap-1">
                                          <Youtube className="w-3 h-3" />
                                          Video
                                        </Badge>
                                      )}
                                      {lesson.notes_text && (
                                        <Badge variant="outline">Notes</Badge>
                                      )}
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openEditLesson(lesson)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Lesson
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        className="text-destructive"
                                        onClick={() => setDeleteLesson(lesson)}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Lesson
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Papers Tab */}
            <TabsContent value="papers" className="space-y-4">
              <ClassPapersManager classId={id!} classTitle={classData.title} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Add/Edit Day Dialog */}
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDay ? 'Edit Class Day' : 'Add Class Day'}</DialogTitle>
            <DialogDescription>
              {editingDay ? 'Update class day details' : 'Add a new class day to the schedule'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dayTitle">Title</Label>
              <Input 
                id="dayTitle" 
                placeholder="e.g., Week 1 - Introduction"
                value={dayTitle}
                onChange={(e) => setDayTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dayDate">Date</Label>
              <Input 
                id="dayDate" 
                type="date"
                value={dayDate}
                onChange={(e) => setDayDate(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label>Extra Session</Label>
                <p className="text-sm text-muted-foreground">Mark as bonus/extra class</p>
              </div>
              <Switch checked={dayIsExtra} onCheckedChange={setDayIsExtra} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDayDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => saveDayMutation.mutate()}
              disabled={saveDayMutation.isPending || !dayTitle || !dayDate}
            >
              {saveDayMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
            <DialogDescription>
              {editingLesson ? 'Update lesson details and materials' : 'Add lesson content and materials'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lessonTitle">Title</Label>
              <Input 
                id="lessonTitle" 
                placeholder="e.g., Introduction to Databases"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessonDescription">Description</Label>
              <Textarea 
                id="lessonDescription" 
                placeholder="Brief description of the lesson..."
                rows={2}
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessonNotes">Notes (optional)</Label>
              <Textarea 
                id="lessonNotes" 
                placeholder="Detailed notes or key points..."
                rows={3}
                value={lessonNotes}
                onChange={(e) => setLessonNotes(e.target.value)}
              />
            </div>

            {/* PDF Upload */}
            <div className="space-y-2">
              <Label>PDF File (optional)</Label>
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
                {lessonPdfUrl && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <FileText className="w-3 h-3" />
                      PDF Uploaded
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setLessonPdfUrl('')}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {lessonPdfUrl ? 'PDF uploaded to server' : 'Max 20MB PDF files'}
              </p>
            </div>

            {/* YouTube URL */}
            <div className="space-y-2">
              <Label htmlFor="lessonYoutubeUrl">YouTube URL (optional)</Label>
              <Input 
                id="lessonYoutubeUrl" 
                placeholder="https://www.youtube.com/watch?v=..."
                value={lessonYoutubeUrl}
                onChange={(e) => setLessonYoutubeUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => saveLessonMutation.mutate()}
              disabled={saveLessonMutation.isPending || !lessonTitle}
            >
              {saveLessonMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Day Confirmation */}
      <AlertDialog open={!!deleteDay} onOpenChange={() => setDeleteDay(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class Day</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDay?.title}"? This will also delete all lessons for this day.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDay && deleteDayMutation.mutate(deleteDay.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Lesson Confirmation */}
      <AlertDialog open={!!deleteLesson} onOpenChange={() => setDeleteLesson(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteLesson?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteLesson && deleteLessonMutation.mutate(deleteLesson.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminClassContent;