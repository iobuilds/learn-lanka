import { useState } from 'react';
import { 
  Search, 
  Filter, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Download,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AdminLayout from '@/components/layouts/AdminLayout';
import { cn } from '@/lib/utils';

// Mock payments data
const mockPayments = [
  { id: '1', user: 'Kasun Perera', phone: '0771234567', type: 'CLASS_MONTH', ref: 'A/L ICT 2026 - Feb', amount: 3500, status: 'PENDING', date: '2024-02-01' },
  { id: '2', user: 'Nimali Silva', phone: '0772345678', type: 'CLASS_MONTH', ref: 'O/L ICT 2025 - Feb', amount: 2500, status: 'APPROVED', date: '2024-02-01' },
  { id: '3', user: 'Tharindu Fernando', phone: '0773456789', type: 'RANK_PAPER', ref: 'Model Paper Jan', amount: 500, status: 'PENDING', date: '2024-01-28' },
  { id: '4', user: 'Sachini Dias', phone: '0774567890', type: 'SHOP_ORDER', ref: 'ICT Theory Notes', amount: 1500, status: 'APPROVED', date: '2024-01-25' },
  { id: '5', user: 'Ravindu Jayasinghe', phone: '0775678901', type: 'CLASS_MONTH', ref: 'A/L ICT 2026 - Feb', amount: 3500, status: 'REJECTED', date: '2024-02-02' },
];

const AdminPayments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch = 
      payment.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesType = typeFilter === 'all' || payment.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingCount = mockPayments.filter(p => p.status === 'PENDING').length;
  const approvedCount = mockPayments.filter(p => p.status === 'APPROVED').length;
  const rejectedCount = mockPayments.filter(p => p.status === 'REJECTED').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="outline" className="badge-paid"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="badge-pending"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="badge-unpaid"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'CLASS_MONTH':
        return <Badge variant="secondary">Class Payment</Badge>;
      case 'RANK_PAPER':
        return <Badge variant="secondary">Rank Paper</Badge>;
      case 'SHOP_ORDER':
        return <Badge variant="secondary">Shop Order</Badge>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground">Verify and manage payments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rejectedCount}</p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="CLASS_MONTH">Class Payment</SelectItem>
                  <SelectItem value="RANK_PAPER">Rank Paper</SelectItem>
                  <SelectItem value="SHOP_ORDER">Shop Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card className="card-elevated">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.user}</p>
                          <p className="text-sm text-muted-foreground">{payment.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(payment.type)}</TableCell>
                      <TableCell>{payment.ref}</TableCell>
                      <TableCell className="font-semibold">Rs. {payment.amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Slip
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download Slip
                            </DropdownMenuItem>
                            {payment.status === 'PENDING' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-success">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredPayments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground mb-2">No payments found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
