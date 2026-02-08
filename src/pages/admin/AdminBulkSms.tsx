import AdminLayout from '@/components/layouts/AdminLayout';
import BulkSmsManager from '@/components/admin/BulkSmsManager';

const AdminBulkSms = () => {
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bulk SMS</h1>
          <p className="text-muted-foreground">Send SMS notifications to users</p>
        </div>
        <BulkSmsManager />
      </div>
    </AdminLayout>
  );
};

export default AdminBulkSms;
