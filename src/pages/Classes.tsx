import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, BookOpen, Users, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StudentLayout from '@/components/layouts/StudentLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const Classes = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  // Fetch all classes
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user's enrollments
  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('class_enrollments')
        .select('class_id')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const enrolledClassIds = enrollments.map(e => e.class_id);

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch = cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesGrade = gradeFilter === 'all' || 
      (parseInt(gradeFilter) >= cls.grade_min && parseInt(gradeFilter) <= cls.grade_max);
    
    return matchesSearch && matchesGrade;
  });

  if (classesLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="section-spacing">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Classes</h1>
          <p className="text-muted-foreground mt-1">
            Browse and enroll in ICT classes
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {[6, 7, 8, 9, 10, 11, 12, 13].map((g) => (
                <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Classes Grid */}
        {filteredClasses.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">No classes found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((cls) => {
              const isEnrolled = enrolledClassIds.includes(cls.id);
              return (
                <Card key={cls.id} className="card-elevated hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">{cls.title}</CardTitle>
                      {cls.is_private && (
                        <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <CardDescription className="line-clamp-3">
                      {cls.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="space-y-4">
                      {/* Class Info */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">
                          Grade {cls.grade_min === cls.grade_max ? cls.grade_min : `${cls.grade_min}-${cls.grade_max}`}
                        </Badge>
                        <Badge variant="outline">
                          Rs. {cls.monthly_fee_amount.toLocaleString()}/mo
                        </Badge>
                        {isEnrolled && (
                          <Badge className="bg-success/10 text-success border-success/20">
                            Enrolled
                          </Badge>
                        )}
                      </div>

                      {/* Action */}
                      <Link to={`/classes/${cls.id}`} className="block">
                        <Button 
                          variant={isEnrolled ? "outline" : "default"} 
                          className="w-full"
                        >
                          {isEnrolled ? 'View Class' : 'View Details'}
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default Classes;
