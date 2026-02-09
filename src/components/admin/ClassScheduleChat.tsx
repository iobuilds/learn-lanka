import { Calendar, Clock, BookOpen, ChevronLeft, ChevronRight, MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO, isToday, isPast, isFuture } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClassDay {
  id: string;
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_conducted: boolean;
  is_extra: boolean;
  class_month: {
    class_id: string;
    classes: {
      id: string;
      title: string;
    };
  };
}

const ClassScheduleChat = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateRange = {
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  };

  const { data: classDays = [], isLoading } = useQuery({
    queryKey: ['schedule-class-days', format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_days')
        .select(`
          id,
          title,
          date,
          start_time,
          end_time,
          is_conducted,
          is_extra,
          class_month:class_month_id (
            class_id,
            classes:class_id (
              id,
              title
            )
          )
        `)
        .gte('date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.end, 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as ClassDay[];
    },
  });

  const navigatePrev = () => setCurrentDate(subWeeks(currentDate, 1));
  const navigateNext = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const formatTime = (startTime: string | null, endTime: string | null) => {
    if (!startTime) return null;
    const formatT = (t: string) => {
      const [h, m] = t.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      return `${hour % 12 || 12}:${m} ${ampm}`;
    };
    return endTime ? `${formatT(startTime)} - ${formatT(endTime)}` : formatT(startTime);
  };

  const getStatusInfo = (day: ClassDay) => {
    const dayDate = parseISO(day.date);
    if (day.is_conducted) {
      return { status: 'completed', label: 'Completed', color: 'text-success', bgColor: 'bg-success/10', icon: CheckCircle2 };
    }
    if (isToday(dayDate)) {
      return { status: 'today', label: 'Today', color: 'text-primary', bgColor: 'bg-primary/10', icon: MessageCircle };
    }
    if (isPast(dayDate)) {
      return { status: 'missed', label: 'Pending', color: 'text-warning', bgColor: 'bg-warning/10', icon: AlertCircle };
    }
    return { status: 'upcoming', label: 'Upcoming', color: 'text-muted-foreground', bgColor: 'bg-muted', icon: Calendar };
  };

  // Group by date
  const groupedByDate = classDays.reduce((acc, day) => {
    const dateKey = day.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(day);
    return acc;
  }, {} as Record<string, ClassDay[]>);

  return (
    <Card className="card-elevated overflow-hidden">
      <CardHeader className="pb-2 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Class Schedule
          </CardTitle>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigatePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-sm font-medium" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
          </span>
        </div>
      </CardHeader>

      <ScrollArea className="h-[420px]">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : classDays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No classes this week</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Schedule classes to see them here</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-border" />

              <div className="space-y-4">
                {Object.entries(groupedByDate).map(([dateStr, days]) => {
                  const dayDate = parseISO(dateStr);
                  const isTodayDate = isToday(dayDate);

                  return (
                    <div key={dateStr} className="relative">
                      {/* Date bubble - like a chat timestamp */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 z-10",
                          isTodayDate 
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20" 
                            : isPast(dayDate) 
                              ? "bg-muted text-muted-foreground" 
                              : "bg-secondary text-secondary-foreground"
                        )}>
                          {format(dayDate, 'd')}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-semibold",
                            isTodayDate && "text-primary"
                          )}>
                            {format(dayDate, 'EEEE')}
                          </span>
                          {isTodayDate && (
                            <Badge className="bg-primary/10 text-primary border-0 text-xs">
                              Today
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Class cards - like chat messages */}
                      <div className="ml-12 space-y-2">
                        {days.map((day) => {
                          const statusInfo = getStatusInfo(day);
                          const StatusIcon = statusInfo.icon;

                          return (
                            <Link
                              key={day.id}
                              to={`/admin/classes/${day.class_month?.classes?.id}/content`}
                              className="block group"
                            >
                              <div className={cn(
                                "relative p-3 rounded-2xl rounded-tl-sm transition-all duration-200",
                                "hover:shadow-md hover:-translate-y-0.5",
                                statusInfo.bgColor,
                                day.is_conducted && "opacity-75"
                              )}>
                                {/* Message tail */}
                                <div className={cn(
                                  "absolute -left-2 top-2 w-3 h-3 rotate-45",
                                  statusInfo.bgColor
                                )} />

                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <BookOpen className={cn("w-4 h-4 shrink-0", statusInfo.color)} />
                                      <p className="font-semibold text-foreground truncate">
                                        {day.class_month?.classes?.title}
                                      </p>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate pl-6">
                                      {day.title}
                                    </p>
                                  </div>

                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                    {day.start_time && (
                                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTime(day.start_time, day.end_time)}
                                      </span>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <StatusIcon className={cn("w-3.5 h-3.5", statusInfo.color)} />
                                      <span className={cn("text-xs font-medium", statusInfo.color)}>
                                        {statusInfo.label}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Tags */}
                                {day.is_extra && (
                                  <div className="mt-2 pl-6">
                                    <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">
                                      Extra Class
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default ClassScheduleChat;
