import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AttemptStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'MARKED';

export interface RankPaperStatus {
  paperId: string;
  attemptId?: string;
  status: AttemptStatus;
  score?: number;
  totalScore?: number;
  submittedAt?: string;
  marksPublished: boolean;
}

export function useRankPaperStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['rank-paper-status', user?.id],
    queryFn: async (): Promise<RankPaperStatus[]> => {
      if (!user) return [];

      // Fetch all user's attempts with their marks
      const { data: attempts, error } = await supabase
        .from('rank_attempts')
        .select(`
          id,
          rank_paper_id,
          submitted_at,
          ends_at,
          auto_closed,
          rank_marks (
            total_score,
            published_at
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      return (attempts || []).map(attempt => {
        const marks = attempt.rank_marks as any;
        const isSubmitted = !!attempt.submitted_at || attempt.auto_closed;
        const isMarked = marks?.published_at != null;
        
        let status: AttemptStatus = 'NOT_STARTED';
        if (isMarked) {
          status = 'MARKED';
        } else if (isSubmitted) {
          status = 'SUBMITTED';
        } else if (new Date(attempt.ends_at) > new Date()) {
          status = 'IN_PROGRESS';
        } else {
          status = 'SUBMITTED'; // Time expired
        }

        return {
          paperId: attempt.rank_paper_id,
          attemptId: attempt.id,
          status,
          score: marks?.total_score,
          submittedAt: attempt.submitted_at,
          marksPublished: isMarked,
        };
      });
    },
    enabled: !!user,
  });
}
