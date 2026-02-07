import { useState } from 'react';
import { Upload, CreditCard, CheckCircle, Clock, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface PaymentUploadFormProps {
  paymentType: 'CLASS_MONTH' | 'RANK_PAPER' | 'SHOP_ORDER';
  refId: string;
  amount: number;
  title: string;
  currentStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  onSuccess?: () => void;
}

const PaymentUploadForm = ({
  paymentType,
  refId,
  amount,
  title,
  currentStatus,
  onSuccess
}: PaymentUploadFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(selectedFile.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image (JPG, PNG) or PDF',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 5MB',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!file || !user) return;

    setIsUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${refId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('payment-slips')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('payment-slips')
        .getPublicUrl(fileName);

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          payment_type: paymentType,
          ref_id: refId,
          amount,
          slip_url: urlData.publicUrl,
          status: 'PENDING',
        });

      if (paymentError) throw paymentError;

      toast({
        title: 'Payment submitted',
        description: 'Your payment slip has been uploaded. We will verify it within 24 hours.',
      });

      setFile(null);
      setPreview(null);
      onSuccess?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Upload your bank transfer slip</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Display */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
          <span className="text-muted-foreground">Amount to Pay</span>
          <span className="text-xl font-bold">Rs. {amount.toLocaleString()}</span>
        </div>

        {/* Current Status */}
        {currentStatus && (
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg",
            currentStatus === 'APPROVED' && "bg-success/10",
            currentStatus === 'PENDING' && "bg-warning/10",
            currentStatus === 'REJECTED' && "bg-destructive/10"
          )}>
            {currentStatus === 'APPROVED' && (
              <>
                <CheckCircle className="w-6 h-6 text-success" />
                <div>
                  <p className="font-medium text-success">Payment Verified</p>
                  <p className="text-sm text-muted-foreground">Access granted</p>
                </div>
              </>
            )}
            {currentStatus === 'PENDING' && (
              <>
                <Clock className="w-6 h-6 text-warning" />
                <div>
                  <p className="font-medium text-warning">Verification Pending</p>
                  <p className="text-sm text-muted-foreground">We'll verify within 24 hours</p>
                </div>
              </>
            )}
            {currentStatus === 'REJECTED' && (
              <>
                <AlertCircle className="w-6 h-6 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Payment Rejected</p>
                  <p className="text-sm text-muted-foreground">Please upload a valid slip</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Upload Form - only show if not approved and not pending */}
        {currentStatus !== 'APPROVED' && currentStatus !== 'PENDING' && (
          <div className="space-y-3">
            <Label>Upload Bank Slip</Label>
            
            {!file ? (
              <div className="relative">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Click or drag to upload your bank slip
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG or PDF up to 5MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-lg border p-4">
                <button
                  onClick={clearFile}
                  className="absolute top-2 right-2 p-1 rounded-full bg-muted hover:bg-muted/80"
                >
                  <X className="w-4 h-4" />
                </button>
                
                {preview ? (
                  <img
                    src={preview}
                    alt="Slip preview"
                    className="max-h-48 mx-auto rounded"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full"
              variant="hero"
              disabled={!file || isUploading}
              onClick={handleSubmit}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Submit Payment'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentUploadForm;
