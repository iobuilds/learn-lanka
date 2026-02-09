import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Check, Loader2, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface EnrollmentWithProfile {
  id: string;
  user_id: string;
  class_id: string;
  status: string;
  enrolled_at: string;
  payment_received_at: string | null;
  payment_amount: number | null;
  admin_note: string | null;
  profile: {
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
}

interface Props {
  classId: string;
  className: string;
}

const PrivateClassEnrollmentsManager = ({ classId, className }: Props) => {
  const queryClient = useQueryClient();
  const [editingEnrollment, setEditingEnrollment] = useState<EnrollmentWithProfile | null>(null);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');

  // Fetch enrollments with profiles
  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['private-class-enrollments', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_enrollments')
        .select(`
          id,
          user_id,
          class_id,
          status,
          enrolled_at,
          payment_received_at,
          payment_amount,
          admin_note
        `)
        .eq('class_id', classId)
        .eq('status', 'ACTIVE')
        .order('enrolled_at', { ascending: false });
      
      if (error) throw error;

      // Fetch profiles for each enrollment
      const enrollmentsWithProfiles: EnrollmentWithProfile[] = [];
      for (const enrollment of data || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('id', enrollment.user_id)
          .single();
        
        enrollmentsWithProfiles.push({
          ...enrollment,
          profile: profile || null,
        });
      }

      return enrollmentsWithProfiles;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingEnrollment) return;
      const { error } = await supabase
        .from('class_enrollments')
        .update({
          payment_received_at: paymentDate ? new Date(paymentDate).toISOString() : null,
          payment_amount: paymentAmount ? parseInt(paymentAmount) : null,
          admin_note: adminNote || null,
        })
        .eq('id', editingEnrollment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Enrollment updated!');
      queryClient.invalidateQueries({ queryKey: ['private-class-enrollments', classId] });
      closeDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update');
    },
  });

  const openEditDialog = (enrollment: EnrollmentWithProfile) => {
    setEditingEnrollment(enrollment);
    setPaymentDate(enrollment.payment_received_at 
      ? new Date(enrollment.payment_received_at).toISOString().slice(0, 10) 
      : '');
    setPaymentAmount(enrollment.payment_amount?.toString() || '');
    setAdminNote(enrollment.admin_note || '');
  };

  const closeDialog = () => {
    setEditingEnrollment(null);
    setPaymentDate('');
    setPaymentAmount('');
    setAdminNote('');
  };

  const markPaidToday = () => {
    setPaymentDate(new Date().toISOString().slice(0, 10));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Student Enrollments</h3>
          <p className="text-sm text-muted-foreground">{className} - {enrollments.length} students</p>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <User className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No students enrolled yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="card-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {enrollment.profile?.first_name} {enrollment.profile?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {enrollment.profile?.phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {enrollment.payment_received_at ? (
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1">
                          <Check className="w-3 h-3" />
                          {format(new Date(enrollment.payment_received_at), 'MMM d, yyyy')}
                        </Badge>
                        {enrollment.payment_amount && (
                          <span className="text-xs text-muted-foreground">
                            Rs. {enrollment.payment_amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-muted gap-1">
                        <Clock className="w-3 h-3" />
                        Not set
                      </Badge>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(enrollment)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
                {enrollment.admin_note && (
                  <p className="text-sm text-muted-foreground mt-2 pl-13">
                    Note: {enrollment.admin_note}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingEnrollment} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Info</DialogTitle>
            <DialogDescription>
              Set payment received date for {editingEnrollment?.profile?.first_name} {editingEnrollment?.profile?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <div className="flex gap-2">
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Amount (Rs.)</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  placeholder="e.g., 5000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={markPaidToday} className="w-full">
              Set Today's Date
            </Button>
            <p className="text-xs text-muted-foreground">
              This payment info will be shown to the student for their reference
            </p>
            <div className="space-y-2">
              <Label htmlFor="adminNote">Admin Note (optional)</Label>
              <Textarea
                id="adminNote"
                placeholder="Internal notes about this enrollment..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button 
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrivateClassEnrollmentsManager;
