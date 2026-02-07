import { 
  Users, 
  BookOpen, 
  CreditCard, 
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/layouts/AdminLayout';
import { mockClasses, mockPaymentStatus } from '@/lib/mock-data';

const AdminDashboard = () => {
  // Mock stats
  const stats = {
    totalUsers: 156,
    activeClasses: mockClasses.length,
    pendingPayments: 12,
    monthlyRevenue: 245000,
    todayLogins: 45,
    newRegistrations: 8,
  };

  const recentPayments = [
    { id: '1', user: 'Kasun Perera', class: 'A/L ICT 2026 Batch', amount: 3500, status: 'PENDING' },
    { id: '2', user: 'Nimali Silva', class: 'O/L ICT 2025 Batch', amount: 2500, status: 'APPROVED' },
    { id: '3', user: 'Tharindu Fernando', class: 'A/L ICT 2026 Batch', amount: 3500, status: 'PENDING' },
    { id: '4', user: 'Sachini Dias', class: 'Grade 9 ICT Foundation', amount: 2000, status: 'APPROVED' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <BookOpen className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeClasses}</p>
                  <p className="text-sm text-muted-foreground">Active Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <DollarSign className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Rs. {(stats.monthlyRevenue / 1000).toFixed(0)}k</p>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Logins</p>
                  <p className="text-3xl font-bold text-foreground">{stats.todayLogins}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New Registrations (Today)</p>
                  <p className="text-3xl font-bold text-foreground">{stats.newRegistrations}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Payments */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Recent Payments</CardTitle>
            <CardDescription>Latest payment submissions requiring verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{payment.user}</p>
                      <p className="text-sm text-muted-foreground">{payment.class}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">Rs. {payment.amount.toLocaleString()}</span>
                    <Badge 
                      variant="outline"
                      className={payment.status === 'APPROVED' ? 'badge-paid' : 'badge-pending'}
                    >
                      {payment.status === 'APPROVED' ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Approved</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1" /> Pending</>
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Class Statistics */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Class Statistics</CardTitle>
            <CardDescription>Enrollment and payment summary by class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockClasses.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">{cls.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Grade {cls.gradeMin === cls.gradeMax ? cls.gradeMin : `${cls.gradeMin}-${cls.gradeMax}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-foreground">42</p>
                      <p className="text-muted-foreground">Students</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-success">38</p>
                      <p className="text-muted-foreground">Paid</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-warning">4</p>
                      <p className="text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
