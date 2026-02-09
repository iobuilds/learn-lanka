import { Calendar, ChevronLeft, ChevronRight, Bell, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, getDaysInMonth, parseISO, getDate, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface ClassWithDays {
  id: string;
  title: string;
  days: {
    id: string;
    date: string;
    title: string;
    start_time: string | null;
    end_time: string | null;
    is_conducted: boolean;
    is_extra: boolean;
  }[];
}

const ClassScheduleGantt = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const queryClient = useQueryClient();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);
  const yearMonth = format(currentMonth, 'yyyy-MM');

  // Fetch all classes with their days for this month
  const { data: classesWithDays = [], isLoading } = useQuery({
    queryKey: ['gantt-schedule', yearMonth],
    queryFn: async () => {
      // Get all classes
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id, title')
        .order('title');
      if (classError) throw classError;

      // Get class months
      const { data: classMonths, error: monthError } = await supabase
        .from('class_months')
        .select('id, class_id')
        .eq('year_month', yearMonth);
      if (monthError) throw monthError;

      // Get class days for this month
      const monthIds = classMonths?.map(m => m.id) || [];
      let classDays: any[] = [];
      if (monthIds.length > 0) {
        const { data, error } = await supabase
          .from('class_days')
          .select('*')
          .in('class_month_id', monthIds);
        if (error) throw error;
        classDays = data || [];
      }

      // Map classes with their days
      return (classes || []).map(cls => {
        const classMonth = classMonths?.find(m => m.class_id === cls.id);
        const days = classDays.filter(d => d.class_month_id === classMonth?.id);
        return { ...cls, days };
      }).filter(cls => cls.days.length > 0) as ClassWithDays[];
    },
  });

  // Publish schedule mutation
  const publishMutation = useMutation({
    mutationFn: async (classData: ClassWithDays) => {
      const monthName = format(currentMonth, 'MMMM yyyy');
      
      // Format schedule details
      const scheduleDetails = classData.days
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(day => {
          const dayDate = parseISO(day.date);
          const dateStr = format(dayDate, 'EEE, MMM d');
          const timeStr = day.start_time 
            ? `${formatTime(day.start_time)}${day.end_time ? ` - ${formatTime(day.end_time)}` : ''}`
            : '';
          return `📅 ${dateStr}${timeStr ? ` at ${timeStr}` : ''}`;
        })
        .join('\n');

      // Create notification with full schedule
      await supabase.from('notifications').insert({
        title: `📅 ${classData.title} - ${monthName} Schedule`,
        message: `Class schedule for ${monthName} has been published!\n\n${scheduleDetails}\n\n${classData.days.length} classes scheduled.`,
        target_type: 'CLASS',
        target_ref: classData.id,
      });

      // Get previous month for payment check
      const prevMonth = format(subMonths(currentMonth, 1), 'yyyy-MM');
      
      // Send SMS only to students who paid in previous month
      await supabase.functions.invoke('send-sms-notification', {
        body: {
          type: 'schedule_published',
          classId: classData.id,
          previousMonthOnly: true,
          previousMonth: prevMonth,
          data: {
            className: classData.title,
            month: monthName,
            classCount: classData.days.length,
            scheduleDetails: classData.days.map(d => ({
              date: format(parseISO(d.date), 'MMM d'),
              time: d.start_time ? formatTime(d.start_time) : null,
            })),
          },
        },
      });

      return classData;
    },
    onSuccess: (data) => {
      toast.success(`Schedule published for ${data.title}! SMS sent to paid students.`);
      queryClient.invalidateQueries({ queryKey: ['gantt-schedule'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to publish schedule');
    },
  });

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };

  const navigatePrev = () => setCurrentMonth(subMonths(currentMonth, 1));
  const navigateNext = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToThisMonth = () => setCurrentMonth(new Date());

  // Generate day numbers for header
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const todayDate = isToday(currentMonth) ? new Date().getDate() : null;

  return (
    <Card className="card-elevated overflow-hidden">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Class Schedule
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigatePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-semibold min-w-[120px]" onClick={goToThisMonth}>
              {format(currentMonth, 'MMMM yyyy')}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : classesWithDays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No classes scheduled this month</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              {/* Header with day numbers */}
              <thead>
                <tr className="border-b">
                  <th className="sticky left-0 z-10 bg-card p-2 text-left text-sm font-medium text-muted-foreground min-w-[180px] border-r">
                    Class
                  </th>
                  {dayNumbers.map(day => (
                    <th 
                      key={day} 
                      className={cn(
                        "p-1 text-center text-xs font-medium min-w-[28px]",
                        todayDate === day && format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM')
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {day}
                    </th>
                  ))}
                  <th className="sticky right-0 z-10 bg-card p-2 text-center text-sm font-medium text-muted-foreground min-w-[80px] border-l">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {classesWithDays.map((cls, index) => {
                  // Create a map of days for quick lookup
                  const dayMap = new Map(
                    cls.days.map(d => [getDate(parseISO(d.date)), d])
                  );

                  return (
                    <tr key={cls.id} className={cn("border-b", index % 2 === 0 ? "bg-muted/20" : "")}>
                      <td className="sticky left-0 z-10 bg-card p-2 border-r">
                        <Link 
                          to={`/admin/classes/${cls.id}/content`}
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block max-w-[160px]"
                        >
                          {cls.title}
                        </Link>
                      </td>
                      {dayNumbers.map(day => {
                        const classDay = dayMap.get(day);
                        return (
                          <td key={day} className="p-0.5">
                            {classDay ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link to={`/admin/classes/${cls.id}/content`}>
                                    <div className={cn(
                                      "h-6 rounded-sm cursor-pointer transition-all hover:scale-110",
                                      classDay.is_conducted 
                                        ? "bg-success/60" 
                                        : classDay.is_extra 
                                          ? "bg-accent" 
                                          : "bg-primary"
                                    )} />
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  <p className="font-medium">{classDay.title}</p>
                                  {classDay.start_time && (
                                    <p className="text-muted-foreground">
                                      {formatTime(classDay.start_time)}
                                      {classDay.end_time && ` - ${formatTime(classDay.end_time)}`}
                                    </p>
                                  )}
                                  {classDay.is_conducted && <Badge className="mt-1 bg-success">Done</Badge>}
                                  {classDay.is_extra && <Badge className="mt-1 bg-accent">Extra</Badge>}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <div className="h-6" />
                            )}
                          </td>
                        );
                      })}
                      <td className="sticky right-0 z-10 bg-card p-1 border-l">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => publishMutation.mutate(cls)}
                          disabled={publishMutation.isPending}
                        >
                          {publishMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Bell className="w-3 h-3" />
                          )}
                          Publish
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 p-3 border-t bg-muted/30 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-sm bg-primary" />
            <span className="text-muted-foreground">Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-sm bg-success/60" />
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-sm bg-accent" />
            <span className="text-muted-foreground">Extra</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassScheduleGantt;
