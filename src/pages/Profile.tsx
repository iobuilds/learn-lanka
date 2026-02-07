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
  CreditCard,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import StudentLayout from '@/components/layouts/StudentLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import EditProfileDialog from '@/components/profile/EditProfileDialog';

const Profile = () => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();
  const { user, profile, signOut, loading, refreshProfile } = auth;
  const currentYearMonth = new Date().toISOString().slice(0, 7);

  // Fetch enrollments
  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('class_enrollments')
        .select('class_id')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch payments
  const { data: payments = [] } = useQuery({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'APPROVED');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  if (!profile) {
    return (
      <StudentLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Please log in to view your profile</p>
          <Link to="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </StudentLayout>
    );
  }

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
                  {profile.first_name} {profile.last_name}
                </h1>
                <p className="text-muted-foreground">
                  {profile.grade ? `Grade ${profile.grade} Student` : 'Student'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">
                    <Phone className="w-3 h-3 mr-1" />
                    {profile.phone}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>

        <EditProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={profile}
          onSuccess={refreshProfile}
        />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{enrollments.length}</p>
              <p className="text-xs text-muted-foreground">Classes</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <Award className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Best Rank</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <CreditCard className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{payments.length}</p>
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
                  <p className="font-medium">{profile.school_name || 'Not specified'}</p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Grade</p>
                  <p className="font-medium">{profile.grade ? `Grade ${profile.grade}` : 'Not specified'}</p>
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
                    {profile.birthday 
                      ? new Date(profile.birthday).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : 'Not specified'
                    }
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
                  <p className="font-medium">{profile.address || 'Not specified'}</p>
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
