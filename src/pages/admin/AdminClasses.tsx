import { useState } from 'react';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  BookOpen, 
  Users,
  Lock,
  Edit,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/components/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const AdminClasses = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gradeMin, setGradeMin] = useState('');
  const [gradeMax, setGradeMax] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // Fetch classes from database
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['admin-classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch enrollment counts
  const { data: enrollmentCounts = {} } = useQuery({
    queryKey: ['enrollment-counts'],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const cls of classes) {
        const { count } = await supabase
          .from('class_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', cls.id)
          .eq('status', 'ACTIVE');
        counts[cls.id] = count || 0;
      }
      return counts;
    },
    enabled: classes.length > 0,
  });

  // Create class mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('classes')
        .insert({
          title,
          description,
          grade_min: parseInt(gradeMin),
          grade_max: parseInt(gradeMax),
          monthly_fee_amount: parseInt(monthlyFee),
          is_private: isPrivate,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Class created successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create class');
    },
  });

  // Delete class mutation
  const deleteMutation = useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Class deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete class');
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGradeMin('');
    setGradeMax('');
    setMonthlyFee('');
    setIsPrivate(false);
  };

  const filteredClasses = classes.filter((cls) => 
    cls.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Classes</h1>
            <p className="text-muted-foreground">Manage your ICT classes</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>
                  Add a new class to your platform
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Class Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., A/L ICT 2026 Batch" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Class description..." 
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gradeMin">Grade Range (Min)</Label>
                    <Select value={gradeMin} onValueChange={setGradeMin}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {[6, 7, 8, 9, 10, 11, 12, 13].map((g) => (
                          <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gradeMax">Grade Range (Max)</Label>
                    <Select value={gradeMax} onValueChange={setGradeMax}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {[6, 7, 8, 9, 10, 11, 12, 13].map((g) => (
                          <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee">Monthly Fee (Rs.)</Label>
                  <Input 
                    id="fee" 
                    type="number" 
                    placeholder="3500"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Private Class</Label>
                    <p className="text-sm text-muted-foreground">Require code to enroll</p>
                  </div>
                  <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !title || !gradeMin || !gradeMax || !monthlyFee}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Class'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Classes Grid */}
        {filteredClasses.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">No classes found</h3>
              <p className="text-sm text-muted-foreground">Create your first class to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((cls) => (
              <Card key={cls.id} className="card-elevated">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{cls.title}</CardTitle>
                        <CardDescription>
                          Grade {cls.grade_min === cls.grade_max ? cls.grade_min : `${cls.grade_min}-${cls.grade_max}`}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Class
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(cls.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Class
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {cls.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Rs. {cls.monthly_fee_amount.toLocaleString()}/mo
                      </Badge>
                      {cls.is_private && (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="w-3 h-3" />
                          Private
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{enrollmentCounts[cls.id] || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminClasses;
