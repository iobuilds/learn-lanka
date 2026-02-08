import { useState } from 'react';
import { 
  Send, 
  Users, 
  MessageSquare, 
  Loader2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Upload,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SmsTemplate {
  id: string;
  template_key: string;
  template_name: string;
  template_body: string;
  is_active: boolean;
}

const BulkSmsManager = () => {
  const [recipients, setRecipients] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [targetGroup, setTargetGroup] = useState<string>('custom');
  const [isSending, setIsSending] = useState(false);

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['sms-templates-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');
      if (error) throw error;
      return data as SmsTemplate[];
    },
  });

  // Fetch user counts for targeting
  const { data: userStats } = useQuery({
    queryKey: ['user-stats-for-sms'],
    queryFn: async () => {
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('user_id')
        .eq('status', 'active');
      
      const enrolledUsers = new Set(enrollments?.map(e => e.user_id) || []);
      
      return {
        total: totalUsers || 0,
        enrolled: enrolledUsers.size,
      };
    },
  });

  // Fetch phone numbers based on target group
  const fetchRecipients = async (group: string): Promise<string[]> => {
    if (group === 'custom') return [];

    let query = supabase.from('profiles').select('phone');

    if (group === 'enrolled') {
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('user_id')
        .eq('status', 'active');
      
      if (enrollments && enrollments.length > 0) {
        const userIds = enrollments.map(e => e.user_id);
        query = query.in('id', userIds);
      }
    }

    const { data } = await query;
    return data?.map(p => p.phone).filter(Boolean) as string[] || [];
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.template_body);
    }
  };

  const handleTargetGroupChange = async (group: string) => {
    setTargetGroup(group);
    if (group !== 'custom') {
      const phones = await fetchRecipients(group);
      setRecipients(phones.join('\n'));
    } else {
      setRecipients('');
    }
  };

  const parseRecipients = (): string[] => {
    return recipients
      .split(/[\n,;]+/)
      .map(r => r.trim())
      .filter(r => r.length > 0);
  };

  const handleSend = async () => {
    const recipientList = parseRecipients();
    
    if (recipientList.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }
    
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      let schedule_time: string | undefined;
      if (isScheduled && scheduleDate && scheduleTime) {
        schedule_time = `${scheduleDate} ${scheduleTime}`;
      }

      const { data, error } = await supabase.functions.invoke('send-bulk-sms', {
        body: {
          recipients: recipientList,
          message: message,
          schedule_time,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast.success(
        isScheduled 
          ? `SMS scheduled for ${recipientList.length} recipients` 
          : `SMS sent to ${recipientList.length} recipients`
      );

      // Clear form
      setRecipients('');
      setMessage('');
      setSelectedTemplate('');
      setIsScheduled(false);
      setScheduleDate('');
      setScheduleTime('');
      setTargetGroup('custom');

    } catch (error: any) {
      console.error('SMS send error:', error);
      toast.error(error.message || 'Failed to send SMS');
    } finally {
      setIsSending(false);
    }
  };

  const recipientCount = parseRecipients().length;
  const charCount = message.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="w-5 h-5" />
          Bulk SMS
        </CardTitle>
        <CardDescription>
          Send SMS notifications to multiple recipients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Selection */}
        <div className="space-y-3">
          <Label>Recipients</Label>
          <Tabs value={targetGroup} onValueChange={handleTargetGroupChange}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="custom">Custom List</TabsTrigger>
              <TabsTrigger value="all">
                All Users ({userStats?.total || 0})
              </TabsTrigger>
              <TabsTrigger value="enrolled">
                Enrolled ({userStats?.enrolled || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Textarea
              placeholder="Enter phone numbers (one per line, or comma/semicolon separated)&#10;e.g., 0771234567&#10;0772345678"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
              </span>
              {targetGroup !== 'custom' && (
                <Badge variant="secondary" className="text-xs">
                  Auto-loaded from {targetGroup === 'all' ? 'all users' : 'enrolled students'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Use Template (Optional)</Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No template</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.template_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {charCount} characters
            </span>
            <span>
              {smsSegments} SMS segment{smsSegments !== 1 ? 's' : ''} per recipient
            </span>
          </div>
        </div>

        {/* Schedule Option */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Schedule for Later</Label>
              <p className="text-xs text-muted-foreground">Send at a specific date and time</p>
            </div>
            <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
          </div>

          {isScheduled && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Cost Estimate */}
        {recipientCount > 0 && (
          <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Estimated Cost</p>
              <p className="text-xs text-muted-foreground">
                {recipientCount} × {smsSegments} segment{smsSegments !== 1 ? 's' : ''}
              </p>
            </div>
            <p className="text-lg font-bold">
              {recipientCount * smsSegments} SMS
            </p>
          </div>
        )}

        {/* Send Button */}
        <Button 
          className="w-full" 
          variant="hero"
          onClick={handleSend}
          disabled={isSending || recipientCount === 0 || !message.trim()}
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : isScheduled ? (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule SMS
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send to {recipientCount} Recipient{recipientCount !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BulkSmsManager;
