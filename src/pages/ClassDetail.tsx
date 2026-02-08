import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  BookOpen, 
  CreditCard, 
  Bell, 
  Lock,
  FileText,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  Youtube,
  Loader2,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StudentLayout from '@/components/layouts/StudentLayout';
import ClassPapersList from '@/components/class/ClassPapersList';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import PaymentUploadForm from '@/components/payments/PaymentUploadForm';
import BankAccountsList from '@/components/payments/BankAccountsList';

const ClassDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [enrollCode, setEnrollCode] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

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

  // Check enrollment status
  const { data: enrollment } = useQuery({
    queryKey: ['enrollment', user?.id, id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from('class_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('class_id', id)
        .eq('status', 'ACTIVE')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  // Fetch current month payment status
  const { data: currentPayment } = useQuery({
    queryKey: ['class-payment', user?.id, id, selectedMonth],
    queryFn: async () => {
      if (!user || !id) return null;
      // ref_id format: classId-yearMonth
      const refId = `${id}-${selectedMonth}`;
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('ref_id', refId)
        .eq('payment_type', 'CLASS_MONTH')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id && !!enrollment,
  });

  // Fetch class days for the month
  const { data: classDays = [] } = useQuery({
    queryKey: ['class-days', id, selectedMonth],
    queryFn: async () => {
      if (!id) return [];
      const { data: classMonth } = await supabase
        .from('class_months')
        .select('id')
        .eq('class_id', id)
        .eq('year_month', selectedMonth)
        .maybeSingle();
      
      if (!classMonth) return [];

      const { data, error } = await supabase
        .from('class_days')
        .select('*')
        .eq('class_month_id', classMonth.id)
        .order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id && !!enrollment,
  });

  // Fetch lessons
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', id, selectedMonth],
    queryFn: async () => {
      if (!id || classDays.length === 0) return [];
      const dayIds = classDays.map(d => d.id);
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .in('class_day_id', dayIds)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id && classDays.length > 0,
  });

  // Fetch bank accounts
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('class_enrollments')
        .insert({
          user_id: user.id,
          class_id: id,
          status: 'ACTIVE',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Successfully enrolled!');
      queryClient.invalidateQueries({ queryKey: ['enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to enroll');
    },
  });

  // Download PDF with watermark
  const handleDownloadPdf = async (lessonId: string, pdfUrl: string) => {
    if (!session?.access_token) {
      toast.error('Please log in to download');
      return;
    }

    setDownloadingPdf(lessonId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-pdf-watermark`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ pdfUrl }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download PDF');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `material-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF downloaded with watermark');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download PDF');
    } finally {
      setDownloadingPdf(null);
    }
  };

  const isEnrolled = !!enrollment;
  const paymentStatus = currentPayment?.status === 'APPROVED' ? 'PAID' 
    : currentPayment?.status === 'PENDING' ? 'PENDING' 
    : 'UNPAID';
  const isPaid = paymentStatus === 'PAID';

  if (classLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  if (!classData) {
    return (
      <StudentLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Class not found</h2>
          <Link to="/classes">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Classes
            </Button>
          </Link>
        </div>
      </StudentLayout>
    );
  }

  // Not enrolled view
  if (!isEnrolled) {
    return (
      <StudentLayout>
        <div className="section-spacing max-w-3xl mx-auto">
          <Link to="/classes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Classes
          </Link>

          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{classData.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {classData.description}
                  </CardDescription>
                </div>
                {classData.is_private && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Private
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Grade Level</p>
                  <p className="text-lg font-semibold">
                    {classData.grade_min === classData.grade_max 
                      ? `Grade ${classData.grade_min}` 
                      : `Grades ${classData.grade_min}-${classData.grade_max}`
                    }
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Monthly Fee</p>
                  <p className="text-lg font-semibold">
                    Rs. {classData.monthly_fee_amount.toLocaleString()}
                  </p>
                </div>
              </div>

              {classData.is_private ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-warning/50 bg-warning/5">
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-warning mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Private Class</h4>
                        <p className="text-sm text-muted-foreground">
                          Enter the class code provided by your teacher to request enrollment.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classCode">Class Code</Label>
                    <Input
                      id="classCode"
                      placeholder="Enter class code"
                      value={enrollCode}
                      onChange={(e) => setEnrollCode(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    variant="hero"
                    disabled={!enrollCode || enrollMutation.isPending}
                    onClick={() => enrollMutation.mutate()}
                  >
                    {enrollMutation.isPending ? 'Requesting...' : 'Request Enrollment'}
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  variant="hero"
                  size="lg"
                  onClick={() => enrollMutation.mutate()}
                  disabled={enrollMutation.isPending}
                >
                  {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
                </Button>
              )}

              <p className="text-sm text-muted-foreground text-center">
                Enrollment is free. Materials are unlocked after monthly payment.
              </p>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  // Enrolled view with tabs
  return (
    <StudentLayout>
      <div className="section-spacing">
        <Link to="/classes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Classes
        </Link>

        {/* Class Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{classData.title}</h1>
            <p className="text-muted-foreground mt-1">{classData.description}</p>
          </div>
          <Badge 
            variant="outline"
            className={cn(
              "text-sm px-4 py-1",
              paymentStatus === 'PAID' && 'badge-paid',
              paymentStatus === 'PENDING' && 'badge-pending',
              paymentStatus === 'UNPAID' && 'badge-unpaid'
            )}
          >
            {paymentStatus === 'PAID' && 'This Month: Paid'}
            {paymentStatus === 'PENDING' && 'Payment Pending'}
            {paymentStatus === 'UNPAID' && 'Payment Required'}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="w-4 h-4 hidden sm:block" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="lessons" className="gap-2">
              <BookOpen className="w-4 h-4 hidden sm:block" />
              Lessons
            </TabsTrigger>
            <TabsTrigger value="papers" className="gap-2">
              <ClipboardList className="w-4 h-4 hidden sm:block" />
              Papers
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="w-4 h-4 hidden sm:block" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2">
              <Bell className="w-4 h-4 hidden sm:block" />
              News
            </TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Monthly Schedule</h2>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-auto"
              />
            </div>

            {classDays.length === 0 ? (
              <Card className="card-elevated">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-foreground mb-2">No schedule yet</h3>
                  <p className="text-sm text-muted-foreground">Schedule will be available soon</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {classDays.map((day, index) => (
                  <Card key={day.id} className={cn(
                    "card-elevated",
                    day.is_extra && "border-accent/50"
                  )}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{day.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {day.is_extra && (
                          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                            Extra Session
                          </Badge>
                        )}
                        {isPaid ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              * Monthly fee covers first 4 sessions. Extra sessions are free once monthly fee is paid.
            </p>
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-4">
            <h2 className="text-lg font-semibold">Lessons & Materials</h2>

            {lessons.length === 0 ? (
              <Card className="card-elevated">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-foreground mb-2">No lessons yet</h3>
                  <p className="text-sm text-muted-foreground">Lessons will be added soon</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {lessons.map((lesson, index) => (
                  <Card key={lesson.id} className="card-elevated relative overflow-hidden">
                    {!isPaid && (
                      <div className="locked-overlay">
                        <div className="text-center p-4">
                          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm font-medium">Pay monthly fee to unlock</p>
                        </div>
                      </div>
                    )}
                    <CardContent className={cn("p-4", !isPaid && "blur-sm")}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                            <span className="font-semibold text-secondary-foreground">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">{lesson.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                            
                            {/* Materials */}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {lesson.pdf_url && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-1"
                                  onClick={() => handleDownloadPdf(lesson.id, lesson.pdf_url)}
                                  disabled={downloadingPdf === lesson.id}
                                >
                                  {downloadingPdf === lesson.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <FileText className="w-4 h-4" />
                                  )}
                                  PDF
                                  <Download className="w-3 h-3" />
                                </Button>
                              )}
                              {lesson.youtube_url && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-1"
                                  onClick={() => window.open(lesson.youtube_url, '_blank')}
                                >
                                  <Youtube className="w-4 h-4 text-red-500" />
                                  Watch Video
                                </Button>
                              )}
                              {lesson.notes_text && (
                                <Button variant="outline" size="sm" className="gap-1">
                                  <BookOpen className="w-4 h-4" />
                                  Notes
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Papers Tab */}
          <TabsContent value="papers" className="space-y-4">
            <h2 className="text-lg font-semibold">Practice Papers</h2>
            <ClassPapersList classId={id!} isPaid={isPaid} />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Payment Status */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <span className="text-muted-foreground">Monthly Fee</span>
                    <span className="text-xl font-bold">
                      Rs. {classData.monthly_fee_amount.toLocaleString()}
                    </span>
                  </div>

                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-lg",
                    paymentStatus === 'PAID' && "bg-success/10",
                    paymentStatus === 'PENDING' && "bg-warning/10",
                    paymentStatus === 'UNPAID' && "bg-destructive/10"
                  )}>
                    {paymentStatus === 'PAID' && (
                      <>
                        <CheckCircle className="w-6 h-6 text-success" />
                        <div>
                          <p className="font-medium text-success">Payment Verified</p>
                          <p className="text-sm text-muted-foreground">All materials unlocked</p>
                        </div>
                      </>
                    )}
                    {paymentStatus === 'PENDING' && (
                      <>
                        <Clock className="w-6 h-6 text-warning" />
                        <div>
                          <p className="font-medium text-warning">Verification Pending</p>
                          <p className="text-sm text-muted-foreground">We'll verify within 24 hours</p>
                        </div>
                      </>
                    )}
                    {paymentStatus === 'UNPAID' && (
                      <>
                        <AlertCircle className="w-6 h-6 text-destructive" />
                        <div>
                          <p className="font-medium text-destructive">Payment Required</p>
                          <p className="text-sm text-muted-foreground">Pay to access materials</p>
                        </div>
                      </>
                    )}
                  </div>

                  {paymentStatus !== 'PAID' && id && (
                    <PaymentUploadForm 
                      paymentType="CLASS_MONTH"
                      refId={`${id}-${selectedMonth}`}
                      amount={classData.monthly_fee_amount}
                      title={`${selectedMonth} Fee`}
                      currentStatus={currentPayment?.status as 'PENDING' | 'APPROVED' | 'REJECTED' | null}
                      onSuccess={() => queryClient.invalidateQueries({ queryKey: ['class-payment'] })}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Bank Accounts */}
              <BankAccountsList />
            </div>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
            <h2 className="text-lg font-semibold">Class Announcements</h2>
            <Card className="card-elevated">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground mb-2">No announcements</h3>
                <p className="text-sm text-muted-foreground">Check back later for updates</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
};

export default ClassDetail;
