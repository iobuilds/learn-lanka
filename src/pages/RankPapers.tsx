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
          <h1 className="text-2xl font-bold text-foreground">Rank Papers</h1>
          <p className="text-muted-foreground mt-1">
            Test your knowledge and compete with others
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search papers..."
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
              {[10, 11, 12, 13].map((g) => (
                <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent">—</p>
              <p className="text-sm text-muted-foreground">Best Rank</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">—</p>
              <p className="text-sm text-muted-foreground">Best Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Papers List */}
        {filteredPapers.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">No papers found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPapers.map((paper) => {
              const hasAttempted = attemptedPaperIds.includes(paper.id);
              const hasPaid = paidPapers.includes(paper.id) || !paper.fee_amount;
              const needsPayment = paper.fee_amount && !hasPaid;

              return (
                <Card key={paper.id} className="card-elevated hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">{paper.title}</CardTitle>
                        <CardDescription>Grade {paper.grade}</CardDescription>
                      </div>
                      {hasAttempted && (
                        <Badge className="bg-success/10 text-success border-success/20">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Paper Info */}
                    <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {paper.time_limit_minutes} minutes
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {[
                          paper.has_mcq && 'MCQ',
                          paper.has_short_essay && 'Short Essay',
                          paper.has_essay && 'Essay'
                        ].filter(Boolean).join(', ')}
                      </span>
                    </div>

                    {/* Fee */}
                    {paper.fee_amount && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <span className="text-sm text-muted-foreground">Paper Fee</span>
                        <span className="font-semibold">Rs. {paper.fee_amount}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {hasAttempted ? (
                        <>
                          <Link to={`/rank-papers/${paper.id}/results`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              <Award className="w-4 h-4 mr-2" />
                              View Results
                            </Button>
                          </Link>
                          <Link to={`/rank-papers/${paper.id}/leaderboard`}>
                            <Button variant="ghost" size="icon">
                              <Award className="w-4 h-4" />
                            </Button>
                          </Link>
                        </>
                      ) : needsPayment ? (
                        <Link to={`/rank-papers/${paper.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <Lock className="w-4 h-4 mr-2" />
                            Pay & Attempt
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/rank-papers/${paper.id}`} className="flex-1">
                          <Button className="w-full">
                            Start Paper
                            <ChevronRight className="w-4 h-4 ml-2" />
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
