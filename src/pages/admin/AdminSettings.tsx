import { useState } from 'react';
import { 
  GraduationCap, 
  Palette, 
  Bell, 
  CreditCard, 
  Upload,
  Save,
  Globe,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/layouts/AdminLayout';

const AdminSettings = () => {
  const [siteName, setSiteName] = useState('ICT Academy');
  const [contactPhone, setContactPhone] = useState('0771112233');
  const [contactEmail, setContactEmail] = useState('info@ictacademy.lk');

  // Feature toggles
  const [rankPapersEnabled, setRankPapersEnabled] = useState(true);
  const [shopEnabled, setShopEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your platform settings</p>
        </div>

        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="bank">Bank Accounts</TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Site Branding
                </CardTitle>
                <CardDescription>Customize how your site looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Your site name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-primary" />
                    </div>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Recommended: 512x512px PNG</p>
                </div>

                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-primary" />
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Favicon
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Recommended: 32x32px ICO or PNG</p>
                </div>

                <div className="space-y-2">
                  <Label>Login Background</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-20 rounded-lg bg-muted flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Recommended: 1920x1080px JPG</p>
                </div>

                <Button className="mt-4">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Feature Toggles</CardTitle>
                <CardDescription>Enable or disable platform features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <Label>Rank Papers</Label>
                    <p className="text-sm text-muted-foreground">Allow students to attempt quizzes and rank papers</p>
                  </div>
                  <Switch checked={rankPapersEnabled} onCheckedChange={setRankPapersEnabled} />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <Label>Shop</Label>
                    <p className="text-sm text-muted-foreground">Enable the materials shop for students</p>
                  </div>
                  <Switch checked={shopEnabled} onCheckedChange={setShopEnabled} />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send SMS notifications to students</p>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>Update your contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="07X XXX XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="info@example.com"
                  />
                </div>
                <Button className="mt-4">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Accounts Tab */}
          <TabsContent value="bank" className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Bank Accounts
                </CardTitle>
                <CardDescription>Manage bank accounts for payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Bank of Ceylon</h4>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Account: </span>
                      <span className="font-mono">12345678901234</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Branch: </span>
                      <span>Colombo Main</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Name: </span>
                      <span>ICT Academy</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Commercial Bank</h4>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Account: </span>
                      <span className="font-mono">98765432109876</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Branch: </span>
                      <span>Kollupitiya</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Name: </span>
                      <span>ICT Academy</span>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Add Bank Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
