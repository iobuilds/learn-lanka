import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Clock, 
  FileText, 
  Award, 
  ChevronRight,
  CheckCircle,
  Lock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StudentLayout from '@/components/layouts/StudentLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const RankPapers = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  // Fetch published rank papers
  const { data: rankPapers = [], isLoading } = useQuery({
    queryKey: ['rank-papers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_papers')
        .select('*')
        .eq('publish_status', 'PUBLISHED')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user's attempts
  const { data: attempts = [] } = useQuery({
    queryKey: ['rank-attempts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('rank_attempts')
        .select('rank_paper_id, submitted_at')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user's rank paper payments
  const { data: paidPapers = [] } = useQuery({
    queryKey: ['rank-payments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('ref_id')
        .eq('user_id', user.id)
        .eq('payment_type', 'RANK_PAPER')
        .eq('status', 'APPROVED');
      if (error) throw error;
      return data?.map(p => p.ref_id) || [];
    },
    enabled: !!user,
  });

  const attemptedPaperIds = attempts.filter(a => a.submitted_at).map(a => a.rank_paper_id);
  const completedCount = attemptedPaperIds.length;

  const filteredPapers = rankPapers.filter((paper) => {
    const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || paper.grade.toString() === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  if (isLoading) {
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
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Rank Papers</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Test your knowledge and compete
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search papers..."
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
              {[10, 11, 12, 13].map((g) => (
                <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="card-elevated">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-primary">{completedCount}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Done</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-accent">—</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Rank</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-success">—</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Papers List */}
        {filteredPapers.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-3 sm:mb-4" />
              <h3 className="font-medium text-foreground mb-2 text-sm sm:text-base">No papers found</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Try adjusting your search</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {filteredPapers.map((paper) => {
              const hasAttempted = attemptedPaperIds.includes(paper.id);
              const hasPaid = paidPapers.includes(paper.id) || !paper.fee_amount;
              const needsPayment = paper.fee_amount && !hasPaid;

              return (
                <Card key={paper.id} className="card-elevated hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2 p-3 sm:p-4 sm:pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-sm sm:text-lg line-clamp-1">{paper.title}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Grade {paper.grade}</CardDescription>
                      </div>
                      {hasAttempted && (
                        <Badge className="bg-success/10 text-success border-success/20 text-xs shrink-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Done
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 pt-0 sm:pt-0">
                    {/* Paper Info */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs sm:text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        {paper.time_limit_minutes}min
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                        {[
                          paper.has_mcq && 'MCQ',
                          paper.has_short_essay && 'Short',
                          paper.has_essay && 'Essay'
                        ].filter(Boolean).join(', ')}
                      </span>
                    </div>

                    {/* Fee */}
                    {paper.fee_amount && (
                      <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted">
                        <span className="text-xs sm:text-sm text-muted-foreground">Fee</span>
                        <span className="font-semibold text-sm sm:text-base">Rs. {paper.fee_amount}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {hasAttempted ? (
                        <>
                          <Link to={`/rank-papers/${paper.id}/results`} className="flex-1">
                            <Button variant="outline" className="w-full" size="sm">
                              <Award className="w-4 h-4 mr-1 sm:mr-2" />
                              Results
                            </Button>
                          </Link>
                          <Link to={`/rank-papers/${paper.id}/leaderboard`}>
                            <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                              <Award className="w-4 h-4" />
                            </Button>
                          </Link>
                        </>
                      ) : needsPayment ? (
                        <Link to={`/rank-papers/${paper.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <Lock className="w-4 h-4 mr-1 sm:mr-2" />
                            Pay & Start
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/rank-papers/${paper.id}`} className="flex-1">
                          <Button className="w-full" size="sm">
                            Start Paper
                            <ChevronRight className="w-4 h-4 ml-1 sm:ml-2" />
                          </Button>
                        </Link>
                      )}
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

export default RankPapers;
