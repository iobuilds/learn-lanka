import { forwardRef, useEffect, useMemo, useState } from 'react';
import { FileText, Download, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StudentLayout from '@/components/layouts/StudentLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Paper {
  id: string;
  title: string;
  description: string | null;
  paper_type: string;
  grade: number | null;
  year: number | null;
  term: number | null;
  school_or_zone: string | null;
  medium: string | null;
  pdf_url: string;
  is_free: boolean;
  download_count: number;
}

const Papers = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('PAST_PAPER');
  const [tabInitialized, setTabInitialized] = useState(false);

  // Fetch papers
  const { data: papers = [], isLoading } = useQuery({
    queryKey: ['papers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('papers')
        .select('*')
        .order('year', { ascending: false });
      if (error) throw error;
      return data as Paper[];
    },
  });

  // Check if user has active subscription (simplified check)
  const { data: hasActiveSubscription = false } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data, error } = await supabase
        .from('payments')
        .select('id')
        .eq('user_id', user.id)
        .eq('payment_type', 'CLASS_MONTH')
        .eq('status', 'APPROVED')
        .like('ref_id', `%-${currentMonth}`)
        .limit(1);
      if (error) return false;
      return data && data.length > 0;
    },
    enabled: !!user,
  });

  const handleViewPdf = async (paper: Paper) => {
    if (!paper.is_free && !hasActiveSubscription) {
      toast.error('This paper requires an active subscription');
      return;
    }

    // Increment download count
    try {
      await supabase
        .from('papers')
        .update({ download_count: (paper.download_count ?? 0) + 1 })
        .eq('id', paper.id);
    } catch (e) {
      // Ignore increment errors
    }
    
    window.open(paper.pdf_url, '_blank');
  };

  useEffect(() => {
    if (tabInitialized) return;
    if (!papers || papers.length === 0) return;

    const hasPast = papers.some((p) => p.paper_type === 'PAST_PAPER');
    const hasSchool = papers.some((p) => p.paper_type === 'SCHOOL_EXAM');
    const hasModel = papers.some((p) => p.paper_type === 'MODEL_PAPER');

    if (activeTab === 'PAST_PAPER' && !hasPast) {
      if (hasSchool) setActiveTab('SCHOOL_EXAM');
      else if (hasModel) setActiveTab('MODEL_PAPER');
    }

    setTabInitialized(true);
  }, [activeTab, papers, tabInitialized]);

  // Filter papers by type
  const filteredPapers = papers.filter(p => p.paper_type === activeTab);

  // Group papers by year for past papers
  const papersByYear = filteredPapers.reduce((acc, paper) => {
    const key = paper.year || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(paper);
    return acc;
  }, {} as Record<string | number, Paper[]>);

  // Group school exams by grade and term
  const schoolExamsByGrade = filteredPapers.reduce((acc, paper) => {
    if (paper.grade) {
      const key = `Grade ${paper.grade}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(paper);
    }
    return acc;
  }, {} as Record<string, Paper[]>);

  const sortedYears = Object.keys(papersByYear).sort((a, b) => Number(b) - Number(a));
  const sortedGrades = Object.keys(schoolExamsByGrade).sort((a, b) => {
    const gradeA = parseInt(a.replace('Grade ', ''));
    const gradeB = parseInt(b.replace('Grade ', ''));
    return gradeB - gradeA;
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Past Papers & Resources</h1>
          <p className="text-muted-foreground">Download past papers and exam resources</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="PAST_PAPER">Past Papers</TabsTrigger>
            <TabsTrigger value="SCHOOL_EXAM">School Exams</TabsTrigger>
            <TabsTrigger value="MODEL_PAPER">Model Papers</TabsTrigger>
          </TabsList>

          {/* Past Papers Tab */}
          <TabsContent value="PAST_PAPER" className="mt-6">
            {sortedYears.length === 0 ? (
              <EmptyState message="No past papers available yet" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedYears.map((year) => (
                  <YearCard 
                    key={year} 
                    year={year} 
                    papers={papersByYear[year]} 
                    onViewPdf={handleViewPdf}
                    hasAccess={hasActiveSubscription}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* School Exams Tab */}
          <TabsContent value="SCHOOL_EXAM" className="mt-6">
            {sortedGrades.length === 0 ? (
              <EmptyState message="No school exams available yet" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedGrades.map((grade) => (
                  <GradeCard 
                    key={grade} 
                    grade={grade} 
                    papers={schoolExamsByGrade[grade]} 
                    onViewPdf={handleViewPdf}
                    hasAccess={hasActiveSubscription}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Model Papers Tab */}
          <TabsContent value="MODEL_PAPER" className="mt-6">
            {filteredPapers.length === 0 ? (
              <EmptyState message="No model papers available yet" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPapers.map((paper) => (
                  <PaperCard 
                    key={paper.id} 
                    paper={paper} 
                    onViewPdf={handleViewPdf}
                    hasAccess={hasActiveSubscription}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
};

// Year Card Component (for Past Papers)
const YearCard = forwardRef<
  HTMLDivElement,
  {
    year: string | number;
    papers: Paper[];
    onViewPdf: (paper: Paper) => void;
    hasAccess: boolean;
  }
>(({ year, papers, onViewPdf, hasAccess }, ref) => (
  <div ref={ref}>
    <Card className="overflow-hidden">
      <div className="bg-foreground text-background px-4 py-3">
        <h3 className="font-bold text-lg text-center">{year} Past Papers</h3>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {papers.map((paper) => (
            <div key={paper.id} className="space-y-2">
              <p className="font-semibold text-sm text-foreground">{paper.title}</p>
              <Button
                className="w-full"
                size="sm"
                onClick={() => onViewPdf(paper)}
                disabled={!paper.is_free && !hasAccess}
              >
                {!paper.is_free && !hasAccess ? (
                  <><Lock className="w-4 h-4 mr-2" /> Locked</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" /> View PDF</>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
));
YearCard.displayName = 'YearCard';

// Grade Card Component (for School Exams)
const GradeCard = forwardRef<
  HTMLDivElement,
  {
    grade: string;
    papers: Paper[];
    onViewPdf: (paper: Paper) => void;
    hasAccess: boolean;
  }
>(({ grade, papers, onViewPdf, hasAccess }, ref) => {
  // Group by term
  const byTerm = papers.reduce((acc, p) => {
    const term = p.term ? `Term ${p.term}` : 'Other';
    if (!acc[term]) acc[term] = [];
    acc[term].push(p);
    return acc;
  }, {} as Record<string, Paper[]>);

  const getMediumLabel = (medium: string | null) => {
    switch (medium) {
      case 'SINHALA':
        return 'සිංහල';
      case 'ENGLISH':
        return 'English';
      case 'TAMIL':
        return 'தமிழ்';
      default:
        return '';
    }
  };

  return (
    <div ref={ref}>
      <Card className="overflow-hidden">
        <div className="bg-foreground text-background px-4 py-3">
          <h3 className="font-bold text-lg text-center">{grade} School Exams</h3>
        </div>
        <CardContent className="p-4 space-y-4">
          {Object.entries(byTerm).map(([term, termPapers]) => (
            <div key={term}>
              <p className="font-medium text-sm text-muted-foreground mb-2">{term}</p>
              <div className="space-y-2">
                {termPapers.map((paper) => (
                  <div
                    key={paper.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{paper.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {paper.school_or_zone && <span>{paper.school_or_zone}</span>}
                        {paper.medium && (
                          <span className="text-primary">{getMediumLabel(paper.medium)}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewPdf(paper)}
                      disabled={!paper.is_free && !hasAccess}
                    >
                      {!paper.is_free && !hasAccess ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        <Download className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
});
GradeCard.displayName = 'GradeCard';

// Single Paper Card
const PaperCard = ({ 
  paper, 
  onViewPdf, 
  hasAccess 
}: { 
  paper: Paper; 
  onViewPdf: (paper: Paper) => void;
  hasAccess: boolean;
}) => (
  <Card className="p-4">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{paper.title}</p>
        {paper.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{paper.description}</p>
        )}
        <Button 
          className="mt-2 w-full" 
          size="sm"
          onClick={() => onViewPdf(paper)}
          disabled={!paper.is_free && !hasAccess}
        >
          {!paper.is_free && !hasAccess ? (
            <><Lock className="w-4 h-4 mr-2" /> Subscription Required</>
          ) : (
            <><Download className="w-4 h-4 mr-2" /> View PDF</>
          )}
        </Button>
      </div>
    </div>
  </Card>
);

// Empty State
const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <FileText className="w-12 h-12 text-muted-foreground mb-4" />
    <p className="text-muted-foreground">{message}</p>
  </div>
);

export default Papers;
