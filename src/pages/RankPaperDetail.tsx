import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Clock, 
  FileText, 
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Lock,
  Users,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import StudentLayout from '@/components/layouts/StudentLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const RankPaperDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [starting, setStarting] = useState(false);

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

  // Fetch existing attempt
  const { data: existingAttempt, isLoading: loadingAttempt } = useQuery({
    queryKey: ['rank-attempt', id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('rank_attempts')
        .select('*')
        .eq('rank_paper_id', id)
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!id && !!user,
  });

  // Check if user has paid for this paper
  const { data: hasPaid } = useQuery({
    queryKey: ['rank-paper-payment', id, user?.id],
    queryFn: async () => {
      if (!user || !paper?.fee_amount) return true; // Free paper
      const { data } = await supabase
        .from('payments')
        .select('id')
        .eq('user_id', user.id)
        .eq('ref_id', id)
        .eq('payment_type', 'RANK_PAPER')
        .eq('status', 'APPROVED')
        .single();
      return !!data;
    },
    enabled: !!id && !!user && !!paper,
  });

  const handleStartAttempt = async () => {
    if (!user || !paper) return;

    setStarting(true);
    try {
      // Check for existing attempt first
      const { data: existing } = await supabase
        .from('rank_attempts')
        .select('id, submitted_at')
        .eq('rank_paper_id', paper.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        if (existing.submitted_at) {
          toast.info('You have already completed this paper');
          navigate(`/rank-papers/${paper.id}/results`);
        } else {
          // Continue existing attempt
          navigate(`/rank-papers/${paper.id}/attempt`);
        }
        return;
      }

      // Navigate to attempt page - it will create the attempt
      navigate(`/rank-papers/${paper.id}/attempt`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to start attempt');
    } finally {
      setStarting(false);
      setShowStartDialog(false);
    }
  };

  if (loadingPaper || loadingAttempt) {
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
          <p className="text-muted-foreground mb-4">This paper may have been removed or is not available.</p>
          <Link to="/rank-papers">
            <Button>Back to Papers</Button>
          </Link>
        </div>
      </StudentLayout>
    );
  }

  const hasSubmitted = existingAttempt?.submitted_at;
  const hasOngoingAttempt = existingAttempt && !existingAttempt.submitted_at;
  const needsPayment = paper.fee_amount && !hasPaid;

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Link */}
        <Link to="/rank-papers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
          Back to Rank Papers
        </Link>

        {/* Paper Info Card */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{paper.title}</CardTitle>
                <CardDescription>Grade {paper.grade}</CardDescription>
              </div>
              {hasSubmitted && (
                <Badge className="bg-success/10 text-success border-success/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
              {hasOngoingAttempt && (
                <Badge className="bg-warning/10 text-warning border-warning/20">
                  <Clock className="w-3 h-3 mr-1" />
                  In Progress
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Paper Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Time Limit</span>
                </div>
                <p className="font-semibold">{paper.time_limit_minutes} minutes</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Sections</span>
                </div>
                <p className="font-semibold">
                  {[
                    paper.has_mcq && 'MCQ',
                    paper.has_short_essay && 'Short Essay',
                    paper.has_essay && 'Essay'
                  ].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>

            {/* Fee Section */}
            {paper.fee_amount ? (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Paper Fee</span>
                  <span className="text-xl font-bold">Rs. {paper.fee_amount}</span>
                </div>
                {needsPayment && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Payment required before attempting this paper
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg border bg-success/5 border-success/20">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Free Paper</span>
                </div>
              </div>
            )}

            {/* Important Instructions */}
            <div className="p-4 rounded-lg border border-warning/30 bg-warning/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-warning">Important Instructions</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Once started, the timer cannot be paused</li>
                    <li>Switching tabs or windows will be recorded</li>
                    <li>Screenshots and copy/paste are disabled</li>
                    <li>Your answers are auto-saved as you progress</li>
                    <li>Make sure you have a stable internet connection</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {hasSubmitted ? (
                <>
                  <Link to={`/rank-papers/${paper.id}/results`} className="flex-1">
                    <Button className="w-full" variant="outline">
                      <Award className="w-4 h-4 mr-2" />
                      View Results
                    </Button>
                  </Link>
                </>
              ) : hasOngoingAttempt ? (
                <Button 
                  className="flex-1" 
                  onClick={() => navigate(`/rank-papers/${paper.id}/attempt`)}
                >
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Continue Attempt
                </Button>
              ) : needsPayment ? (
                <Button className="flex-1" variant="outline" disabled>
                  <Lock className="w-4 h-4 mr-2" />
                  Payment Required
                </Button>
              ) : (
                <Button 
                  className="flex-1" 
                  onClick={() => setShowStartDialog(true)}
                  disabled={starting}
                >
                  {starting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-2" />
                  )}
                  Start Paper
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Start Confirmation Dialog */}
      <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Exam?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to start <strong>{paper.title}</strong>.
              </p>
              <p>
                You will have <strong>{paper.time_limit_minutes} minutes</strong> to complete this paper.
                The timer will start immediately and cannot be paused.
              </p>
              <p className="text-warning">
                Make sure you are ready before proceeding.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={starting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartAttempt} disabled={starting}>
              {starting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start Now'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StudentLayout>
  );
};

export default RankPaperDetail;
