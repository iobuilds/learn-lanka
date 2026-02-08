import { useParams, Link } from 'react-router-dom';
import { 
  Trophy, 
  Medal,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Crown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StudentLayout from '@/components/layouts/StudentLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const RankPaperLeaderboard = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  // Fetch paper details
  const { data: paper, isLoading: loadingPaper } = useQuery({
    queryKey: ['rank-paper', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_papers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch leaderboard - published marks with user profiles
  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useQuery({
    queryKey: ['rank-leaderboard', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_marks')
        .select(`
          total_score,
          mcq_score,
          short_essay_score,
          essay_score,
          published_at,
          attempt_id,
          rank_attempts!inner (
            user_id,
            rank_paper_id
          )
        `)
        .not('published_at', 'is', null)
        .order('total_score', { ascending: false });
      
      if (error) throw error;
      
      // Filter by paper_id and get user profiles
      const paperMarks = data?.filter((m: any) => m.rank_attempts?.rank_paper_id === id) || [];
      
      // Fetch profiles for these users
      const userIds = paperMarks.map((m: any) => m.rank_attempts?.user_id).filter(Boolean);
      
      if (userIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return paperMarks.map((mark: any, index: number) => ({
        rank: index + 1,
        userId: mark.rank_attempts?.user_id,
        name: profileMap.get(mark.rank_attempts?.user_id)
          ? `${profileMap.get(mark.rank_attempts?.user_id)?.first_name} ${profileMap.get(mark.rank_attempts?.user_id)?.last_name}`
          : 'Anonymous',
        totalScore: mark.total_score || 0,
        mcqScore: mark.mcq_score || 0,
        shortEssayScore: mark.short_essay_score || 0,
        essayScore: mark.essay_score || 0,
      }));
    },
    enabled: !!id,
  });

  if (loadingPaper || loadingLeaderboard) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  if (!paper) {
    return (
      <StudentLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertTriangle className="w-16 h-16 text-warning mb-4" />
          <h2 className="text-xl font-bold mb-2">Paper Not Found</h2>
          <Link to="/rank-papers">
            <Button>Back to Papers</Button>
          </Link>
        </div>
      </StudentLayout>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-warning" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-primary" />;
    return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-warning/10 border-warning/30';
    if (rank === 2) return 'bg-muted border-border';
    if (rank === 3) return 'bg-primary/10 border-primary/30';
    return 'bg-muted/50';
  };

  // Find current user's rank
  const userRank = leaderboard.find((entry: any) => entry.userId === user?.id);

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Link */}
        <Link to={`/rank-papers/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
          Back to Paper
        </Link>

        {/* Header */}
        <Card className="card-elevated">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>{paper.title}</CardDescription>
          </CardHeader>
          
          {userRank && (
            <CardContent>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <p className="text-sm text-muted-foreground">Your Rank</p>
                <p className="text-3xl font-bold text-primary">#{userRank.rank}</p>
                <p className="text-sm text-muted-foreground">Score: {userRank.totalScore}</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Leaderboard List */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Rankings</CardTitle>
            <CardDescription>{leaderboard.length} participants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No results published yet</p>
                <p className="text-sm">Check back after results are released</p>
              </div>
            ) : (
              leaderboard.map((entry: any) => (
                <div 
                  key={entry.userId}
                  className={`p-4 rounded-lg border flex items-center gap-4 ${getRankBg(entry.rank)} ${
                    entry.userId === user?.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {entry.name}
                      {entry.userId === user?.id && (
                        <span className="ml-2 text-xs text-primary">(You)</span>
                      )}
                    </p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {paper.has_mcq && <span>MCQ: {entry.mcqScore}</span>}
                      {paper.has_short_essay && <span>Short: {entry.shortEssayScore}</span>}
                      {paper.has_essay && <span>Essay: {entry.essayScore}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{entry.totalScore}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default RankPaperLeaderboard;
