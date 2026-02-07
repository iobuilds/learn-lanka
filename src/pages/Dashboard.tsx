import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  ShoppingBag, 
  CreditCard,
  TrendingUp,
  Calendar,
  ChevronRight,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StudentLayout from '@/components/layouts/StudentLayout';
import { mockClasses, mockEnrolledClassIds, mockPaymentStatus, mockCurrentUser, mockRankPapers } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const enrolledClasses = mockClasses.filter(c => mockEnrolledClassIds.includes(c.id));
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <StudentLayout>
      <div className="section-spacing">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {mockCurrentUser.firstName}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Continue your learning journey
            </p>
          </div>
          <Link to="/classes">
            <Button variant="accent">
              Browse Classes
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{enrolledClasses.length}</p>
                  <p className="text-sm text-muted-foreground">Enrolled Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CreditCard className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Object.values(mockPaymentStatus).filter(s => s === 'PAID').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Paid This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockRankPapers.length}</p>
                  <p className="text-sm text-muted-foreground">Available Papers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <TrendingUp className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">#12</p>
                  <p className="text-sm text-muted-foreground">Your Rank</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Classes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">My Classes</h2>
            <Link to="/classes" className="text-sm text-primary hover:text-primary/80">
              View All
            </Link>
          </div>

          {enrolledClasses.length === 0 ? (
            <Card className="card-elevated">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground mb-2">No classes enrolled</h3>
                <p className="text-sm text-muted-foreground mb-4">Browse our catalog to find classes</p>
                <Link to="/classes">
                  <Button>Browse Classes</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {enrolledClasses.map((cls) => {
                const paymentStatus = mockPaymentStatus[cls.id] || 'UNPAID';
                return (
                  <Card key={cls.id} className="card-elevated hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{cls.title}</CardTitle>
                        <Badge 
                          variant="outline"
                          className={cn(
                            paymentStatus === 'PAID' && 'badge-paid',
                            paymentStatus === 'PENDING' && 'badge-pending',
                            paymentStatus === 'UNPAID' && 'badge-unpaid'
                          )}
                        >
                          {paymentStatus === 'PAID' && 'Paid'}
                          {paymentStatus === 'PENDING' && 'Pending'}
                          {paymentStatus === 'UNPAID' && 'Unpaid'}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {cls.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {currentMonth}
                          </span>
                          <span>Rs. {cls.monthlyFeeAmount.toLocaleString()}/mo</span>
                        </div>
                        <Link to={`/classes/${cls.id}`}>
                          <Button variant="ghost" size="sm">
                            View
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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/classes" className="block">
            <Card className="card-elevated hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-primary/10 mb-3">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium text-sm">Browse Classes</h3>
              </CardContent>
            </Card>
          </Link>

          <Link to="/rank-papers" className="block">
            <Card className="card-elevated hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-accent/10 mb-3">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-medium text-sm">Rank Papers</h3>
              </CardContent>
            </Card>
          </Link>

          <Link to="/shop" className="block">
            <Card className="card-elevated hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-success/10 mb-3">
                  <ShoppingBag className="w-6 h-6 text-success" />
                </div>
                <h3 className="font-medium text-sm">Shop Materials</h3>
              </CardContent>
            </Card>
          </Link>

          <Link to="/past-papers" className="block">
            <Card className="card-elevated hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-secondary mb-3">
                  <Clock className="w-6 h-6 text-secondary-foreground" />
                </div>
                <h3 className="font-medium text-sm">Past Papers</h3>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Upcoming Rank Papers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Available Rank Papers</h2>
            <Link to="/rank-papers" className="text-sm text-primary hover:text-primary/80">
              View All
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {mockRankPapers.slice(0, 2).map((paper) => (
              <Card key={paper.id} className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-foreground">{paper.title}</h3>
                      <p className="text-sm text-muted-foreground">Grade {paper.grade}</p>
                    </div>
                    {paper.feeAmount && (
                      <Badge variant="outline">Rs. {paper.feeAmount}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {paper.timeLimitMinutes} mins
                    </span>
                    <span>
                      {[
                        paper.hasMcq && 'MCQ',
                        paper.hasShortEssay && 'Short Essay',
                        paper.hasEssay && 'Essay'
                      ].filter(Boolean).join(' • ')}
                    </span>
                  </div>
                  <Link to={`/rank-papers/${paper.id}`}>
                    <Button variant="outline" className="w-full">
                      Start Paper
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Dashboard;
