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
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Classes</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Browse and enroll in ICT classes
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-full sm:w-[140px] h-10">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Grade" />
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
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-3 sm:mb-4" />
              <h3 className="font-medium text-foreground mb-2 text-sm sm:text-base">No classes found</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((cls) => {
              const isEnrolled = enrolledClassIds.includes(cls.id);
              return (
                <Card key={cls.id} className="card-elevated hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader className="pb-2 p-3 sm:p-4 sm:pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm sm:text-lg line-clamp-2">{cls.title}</CardTitle>
                      {cls.is_private && (
                        <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                      {cls.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end p-3 sm:p-4 pt-0 sm:pt-0">
                    <div className="space-y-3 sm:space-y-4">
                      {/* Class Info */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          Grade {cls.grade_min === cls.grade_max ? cls.grade_min : `${cls.grade_min}-${cls.grade_max}`}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Rs. {cls.monthly_fee_amount.toLocaleString()}/mo
                        </Badge>
                        {isEnrolled && (
                          <Badge className="bg-success/10 text-success border-success/20 text-xs">
                            Enrolled
                          </Badge>
                        )}
                      </div>

                      {/* Action */}
                      <Link to={`/classes/${cls.id}`} className="block">
                        <Button 
                          variant={isEnrolled ? "outline" : "default"} 
                          className="w-full"
                          size="sm"
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
