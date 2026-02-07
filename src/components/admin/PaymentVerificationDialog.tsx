import { useState } from 'react';
import { CheckCircle, XCircle, Loader2, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Payment {
  id: string;
  user_id: string;
  payment_type: string;
  amount: number;
  slip_url: string | null;
  status: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

interface PaymentVerificationDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PaymentVerificationDialog = ({
  payment,
  open,
  onOpenChange,
  onSuccess
}: PaymentVerificationDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleVerify = async (approved: boolean) => {
    if (!payment || !user) return;

    if (approved) {
      setIsApproving(true);
    } else {
      setIsRejecting(true);
    }

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: approved ? 'APPROVED' : 'REJECTED',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          note: note || null,
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: approved ? 'Payment Approved' : 'Payment Rejected',
        description: `The payment has been ${approved ? 'approved' : 'rejected'} successfully.`,
      });

      setNote('');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update payment',
        variant: 'destructive',
      });
    } finally {
      setIsApproving(false);
      setIsRejecting(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Verify Payment</DialogTitle>
          <DialogDescription>
            Review the payment slip and approve or reject
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">User</p>
              <p className="font-medium">
                {payment.profiles?.first_name} {payment.profiles?.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{payment.profiles?.phone}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-xl font-bold">Rs. {payment.amount.toLocaleString()}</p>
            </div>
          </div>

          {/* Slip Preview */}
          {payment.slip_url && (
            <div className="space-y-2">
              <Label>Bank Slip</Label>
              <div className="relative rounded-lg border overflow-hidden bg-muted">
                {payment.slip_url.endsWith('.pdf') ? (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">PDF Document</p>
                    <div className="flex justify-center gap-2">
                      <a href={payment.slip_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View PDF
                        </Button>
                      </a>
                      <a href={payment.slip_url} download>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <img
                    src={payment.slip_url}
                    alt="Payment slip"
                    className="max-h-[400px] w-full object-contain"
                  />
                )}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="Add a note for rejection reason or approval comment..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleVerify(false)}
            disabled={isApproving || isRejecting}
            className="text-destructive hover:bg-destructive/10"
          >
            {isRejecting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            Reject
          </Button>
          <Button
            onClick={() => handleVerify(true)}
            disabled={isApproving || isRejecting}
            className="bg-success hover:bg-success/90"
          >
            {isApproving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentVerificationDialog;
