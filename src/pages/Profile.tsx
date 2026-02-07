import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Phone, 
  School, 
  MapPin, 
  Calendar, 
  GraduationCap,
  Edit,
  LogOut,
  ChevronRight,
  Award,
  BookOpen,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import StudentLayout from '@/components/layouts/StudentLayout';
import { mockCurrentUser, mockEnrolledClassIds, mockPaymentStatus } from '@/lib/mock-data';

const Profile = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // In real app, clear auth state
    navigate('/login');
  };

  return (
    <StudentLayout>
      <div className="section-spacing max-w-2xl mx-auto">
        {/* Profile Header */}
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground">
                  {mockCurrentUser.firstName} {mockCurrentUser.lastName}
                </h1>
                <p className="text-muted-foreground">
                  Grade {mockCurrentUser.grade} Student
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">
                    <Phone className="w-3 h-3 mr-1" />
                    {mockCurrentUser.phone}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{mockEnrolledClassIds.length}</p>
              <p className="text-xs text-muted-foreground">Classes</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <Award className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold">#12</p>
              <p className="text-xs text-muted-foreground">Best Rank</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <CreditCard className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {Object.values(mockPaymentStatus).filter(s => s === 'PAID').length}
              </p>
              <p className="text-xs text-muted-foreground">Paid</p>
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <School className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">School</p>
                  <p className="font-medium">{mockCurrentUser.schoolName}</p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Grade</p>
                  <p className="font-medium">Grade {mockCurrentUser.grade}</p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Birthday</p>
                  <p className="font-medium">
                    {new Date(mockCurrentUser.birthday).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{mockCurrentUser.address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="card-elevated">
          <CardContent className="p-0">
            <Link 
              to="/performance" 
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-accent" />
                <span className="font-medium">Performance History</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
            <Separator />
            <Link 
              to="/past-papers" 
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="font-medium">Past Papers</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
            <Separator />
            <Link 
              to="/contact" 
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-success" />
                <span className="font-medium">Contact Us</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button 
          variant="outline" 
          className="w-full text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </StudentLayout>
  );
};

export default Profile;
