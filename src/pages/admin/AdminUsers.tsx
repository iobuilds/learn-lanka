import { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  User, 
  Phone, 
  School,
  Ban,
  CheckCircle,
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/components/layouts/AdminLayout';
import { cn } from '@/lib/utils';

// Mock users data
const mockUsers = [
  { id: '1', phone: '0771234567', firstName: 'Kasun', lastName: 'Perera', school: 'Royal College', grade: 12, status: 'ACTIVE', enrolledClasses: 2 },
  { id: '2', phone: '0772345678', firstName: 'Nimali', lastName: 'Silva', school: 'Visakha Vidyalaya', grade: 11, status: 'ACTIVE', enrolledClasses: 1 },
  { id: '3', phone: '0773456789', firstName: 'Tharindu', lastName: 'Fernando', school: 'Ananda College', grade: 13, status: 'SUSPENDED', enrolledClasses: 3 },
  { id: '4', phone: '0774567890', firstName: 'Sachini', lastName: 'Dias', school: "St. Bridget's Convent", grade: 9, status: 'ACTIVE', enrolledClasses: 1 },
  { id: '5', phone: '0775678901', firstName: 'Ravindu', lastName: 'Jayasinghe', school: 'D.S. Senanayake College', grade: 12, status: 'ACTIVE', enrolledClasses: 2 },
];

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesGrade = gradeFilter === 'all' || user.grade.toString() === gradeFilter;
    return matchesSearch && matchesStatus && matchesGrade;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground">Manage student accounts</p>
          </div>
          <Badge variant="secondary" className="w-fit">
            {mockUsers.length} total users
          </Badge>
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
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {[6, 7, 8, 9, 10, 11, 12, 13].map((g) => (
                    <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="card-elevated">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium">{user.firstName} {user.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{user.phone}</TableCell>
                      <TableCell>{user.school}</TableCell>
                      <TableCell>Grade {user.grade}</TableCell>
                      <TableCell>{user.enrolledClasses}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={cn(
                            user.status === 'ACTIVE' ? 'badge-paid' : 'badge-unpaid'
                          )}
                        >
                          {user.status === 'ACTIVE' ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                          ) : (
                            <><Ban className="w-3 h-3 mr-1" /> Suspended</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <User className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Key className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className={user.status === 'ACTIVE' ? 'text-destructive' : 'text-success'}>
                              {user.status === 'ACTIVE' ? (
                                <><Ban className="w-4 h-4 mr-2" /> Suspend User</>
                              ) : (
                                <><CheckCircle className="w-4 h-4 mr-2" /> Activate User</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <User className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground mb-2">No users found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
