import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  BookOpen, 
  CreditCard, 
  Bell, 
  Lock,
  Play,
  FileText,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  Youtube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StudentLayout from '@/components/layouts/StudentLayout';
import { mockClasses, mockEnrolledClassIds, mockPaymentStatus, mockLessons, mockClassDays, mockBankAccounts } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const ClassDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedMonth, setSelectedMonth] = useState('2024-02');
  const [enrollCode, setEnrollCode] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  const classData = mockClasses.find(c => c.id === id);
  const isEnrolled = mockEnrolledClassIds.includes(id || '');
  const paymentStatus = mockPaymentStatus[id || ''] || 'UNPAID';
  const isPaid = paymentStatus === 'PAID';

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

  const handleEnroll = () => {
    setIsEnrolling(true);
    setTimeout(() => {
      setIsEnrolling(false);
      // In real app, this would update enrollment status
    }, 1500);
  };

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
                {classData.isPrivate && (
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
                    {classData.gradeMin === classData.gradeMax 
                      ? `Grade ${classData.gradeMin}` 
                      : `Grades ${classData.gradeMin}-${classData.gradeMax}`
                    }
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Monthly Fee</p>
                  <p className="text-lg font-semibold">
                    Rs. {classData.monthlyFeeAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {classData.isPrivate ? (
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
                    disabled={!enrollCode || isEnrolling}
                    onClick={handleEnroll}
                  >
                    {isEnrolling ? 'Requesting...' : 'Request Enrollment'}
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  variant="hero"
                  size="lg"
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
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
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="w-4 h-4 hidden sm:block" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="lessons" className="gap-2">
              <BookOpen className="w-4 h-4 hidden sm:block" />
              Lessons
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

            <div className="grid gap-3">
              {mockClassDays.map((day, index) => (
                <Card key={day.id} className={cn(
                  "card-elevated",
                  day.isExtra && "border-accent/50"
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
                      {day.isExtra && (
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

            <p className="text-sm text-muted-foreground">
              * Monthly fee covers first 4 sessions. Extra sessions are free once monthly fee is paid.
            </p>
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-4">
            <h2 className="text-lg font-semibold">Lessons & Materials</h2>

            <div className="grid gap-4">
              {mockLessons.map((lesson, index) => (
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
                            {lesson.pdfUrl && (
                              <Button variant="outline" size="sm" className="gap-1">
                                <FileText className="w-4 h-4" />
                                PDF
                                <Download className="w-3 h-3" />
                              </Button>
                            )}
                            {lesson.youtubeUrl && (
                              <Button variant="outline" size="sm" className="gap-1">
                                <Youtube className="w-4 h-4 text-red-500" />
                                Watch Video
                              </Button>
                            )}
                            {lesson.notesText && (
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
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Payment Status */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="text-lg">February 2024 Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <span className="text-muted-foreground">Monthly Fee</span>
                    <span className="text-xl font-bold">
                      Rs. {classData.monthlyFeeAmount.toLocaleString()}
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

                  {paymentStatus === 'UNPAID' && (
                    <div className="space-y-3">
                      <Label>Upload Bank Slip</Label>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click or drag to upload your bank slip
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG or PDF up to 5MB
                        </p>
                      </div>
                      <Button className="w-full" variant="hero">Submit Payment</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bank Accounts */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="text-lg">Bank Accounts</CardTitle>
                  <CardDescription>Transfer to any of these accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockBankAccounts.map((account) => (
                    <div key={account.id} className="p-4 rounded-lg border">
                      <p className="font-medium text-foreground">{account.bankName}</p>
                      <p className="text-sm text-muted-foreground">{account.branch}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Account: </span>
                          <span className="font-mono">{account.accountNumber}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Name: </span>
                          {account.accountName}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
            <h2 className="text-lg font-semibold">Class Announcements</h2>
            
            <Card className="card-elevated">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Class Schedule Update</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Saturday's class has been rescheduled to Sunday 4 PM due to the holiday.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Feb 2, 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Bell className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No more announcements</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
};

export default ClassDetail;
