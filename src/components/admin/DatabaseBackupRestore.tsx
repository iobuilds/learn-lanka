import { useState, useRef } from 'react';
import { Download, Upload, Database, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DatabaseBackupRestore = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const response = await supabase.functions.invoke('database-backup', {
        body: { action: 'backup' },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Create and download the backup file
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastBackup(new Date().toLocaleString());
      toast.success('Backup downloaded successfully');
    } catch (error: any) {
      console.error('Backup error:', error);
      toast.error(error.message || 'Failed to create backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        toast.error('Please select a valid JSON backup file');
        return;
      }
      setRestoreFile(file);
      setShowRestoreConfirm(true);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) return;

    setIsRestoring(true);
    setShowRestoreConfirm(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      // Read the file
      const fileContent = await restoreFile.text();
      const backupData = JSON.parse(fileContent);

      // Validate backup format
      if (!backupData._meta) {
        throw new Error('Invalid backup file format');
      }

      const response = await supabase.functions.invoke('database-backup', {
        body: { action: 'restore', backupData },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Check results
      const results = response.data.results;
      const failed = Object.entries(results).filter(([_, r]: [string, any]) => !r.success);

      if (failed.length > 0) {
        toast.warning(`Restore completed with ${failed.length} table(s) having issues`);
        console.warn('Restore issues:', failed);
      } else {
        toast.success('Database restored successfully');
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      toast.error(error.message || 'Failed to restore database');
    } finally {
      setIsRestoring(false);
      setRestoreFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Backup & Restore
        </CardTitle>
        <CardDescription>
          Create backups of your data and restore from previous backups
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important Notes</AlertTitle>
          <AlertDescription className="text-sm space-y-1">
            <p>• Backups include all table data but NOT schema (tables, functions, RLS policies)</p>
            <p>• Schema changes are managed through migrations</p>
            <p>• Restore will merge/update existing data (upsert operation)</p>
            <p>• Always test restores on a non-production environment first</p>
          </AlertDescription>
        </Alert>

        {/* Backup Section */}
        <div className="space-y-3">
          <h3 className="font-medium">Create Backup</h3>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="gap-2"
            >
              {isBackingUp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isBackingUp ? 'Creating Backup...' : 'Download Backup'}
            </Button>
            {lastBackup && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Last backup: {lastBackup}
              </span>
            )}
          </div>
        </div>

        {/* Restore Section */}
        <div className="space-y-3">
          <h3 className="font-medium">Restore from Backup</h3>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="restore-file"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="gap-2"
            >
              {isRestoring ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isRestoring ? 'Restoring...' : 'Select Backup File'}
            </Button>
          </div>
        </div>

        {/* Restore Confirmation Dialog */}
        <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Confirm Database Restore
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>You are about to restore the database from:</p>
                <p className="font-medium">{restoreFile?.name}</p>
                <p className="text-destructive font-medium">
                  This will update existing records with data from the backup file.
                  This action cannot be undone!
                </p>
                <p>Are you sure you want to continue?</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRestore}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Restore Database
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default DatabaseBackupRestore;
