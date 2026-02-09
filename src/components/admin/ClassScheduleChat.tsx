import { Calendar, Clock, BookOpen, ChevronLeft, ChevronRight, Play, CheckCircle2, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO, isToday, isBefore, isAfter } from 'date-fns';
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
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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

  const formatTime12h = (time: string | null) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };

  // Check if a class is currently happening
  const isClassNow = (day: ClassDay) => {
    if (!isToday(parseISO(day.date)) || !day.start_time) return false;
    const now = currentTime;
    const [startH, startM] = day.start_time.split(':').map(Number);
    const [endH, endM] = day.end_time ? day.end_time.split(':').map(Number) : [startH + 1, startM];
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  };

  // Check if class is upcoming today
  const isUpcomingToday = (day: ClassDay) => {
    if (!isToday(parseISO(day.date)) || !day.start_time || day.is_conducted) return false;
    const now = currentTime;
    const [startH, startM] = day.start_time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return nowMinutes < startMinutes;
  };

  // Find currently happening class
  const currentClass = classDays.find(isClassNow);
  
  // Find next upcoming class
  const upcomingClasses = classDays.filter(d => {
    const dayDate = parseISO(d.date);
    if (d.is_conducted) return false;
    if (isToday(dayDate)) return isUpcomingToday(d);
    return isAfter(dayDate, currentTime);
  });
  const nextClass = upcomingClasses[0];

  // Past classes (completed or past date)
  const pastClasses = classDays.filter(d => {
    if (d.is_conducted) return true;
    const dayDate = parseISO(d.date);
    if (isBefore(dayDate, new Date()) && !isToday(dayDate)) return true;
    return false;
  });

  return (
    <Card className="card-elevated overflow-hidden">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-card animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-lg">Class Schedule</CardTitle>
              <p className="text-xs text-muted-foreground">
                {format(currentTime, 'EEEE, MMM d • h:mm a')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigatePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium" onClick={goToToday}>
              This Week
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Badge variant="outline" className="text-xs">
            {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d')}
          </Badge>
        </div>
      </CardHeader>

      <ScrollArea className="h-[400px]">
        <CardContent className="p-4 space-y-4">
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
            </div>
          ) : (
            <>
              {/* NOW - Currently Happening */}
              {currentClass && (
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/20 text-success">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Live Now</span>
                    </div>
                  </div>
                  <Link to={`/admin/classes/${currentClass.class_month?.classes?.id}/content`}>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-success/20 via-success/10 to-transparent border border-success/30 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                          <Play className="w-6 h-6 text-success fill-success" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate">
                            {currentClass.class_month?.classes?.title}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">{currentClass.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-success" />
                            <span className="text-xs text-success font-medium">
                              {formatTime12h(currentClass.start_time)} - {formatTime12h(currentClass.end_time)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* NEXT UP */}
              {nextClass && !isClassNow(nextClass) && (
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/20 text-primary">
                      <Timer className="w-3 h-3" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Next Up</span>
                    </div>
                  </div>
                  <Link to={`/admin/classes/${nextClass.class_month?.classes?.id}/content`}>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate">
                            {nextClass.class_month?.classes?.title}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">{nextClass.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-primary font-medium">
                              {format(parseISO(nextClass.date), 'EEE, MMM d')}
                            </span>
                            {nextClass.start_time && (
                              <span className="text-xs text-muted-foreground">
                                {formatTime12h(nextClass.start_time)}
                              </span>
                            )}
                          </div>
                        </div>
                        {nextClass.is_extra && (
                          <Badge className="bg-accent/20 text-accent border-0 text-xs shrink-0">
                            Extra
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* UPCOMING TIMELINE */}
              {upcomingClasses.length > 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Upcoming</span>
                  </div>
                  <div className="space-y-2 pl-2 border-l-2 border-dashed border-border">
                    {upcomingClasses.slice(1, 5).map((day) => (
                      <Link
                        key={day.id}
                        to={`/admin/classes/${day.class_month?.classes?.id}/content`}
                        className="block"
                      >
                        <div className="relative pl-4 py-2 hover:bg-muted/50 rounded-r-lg transition-colors">
                          <div className="absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-2 border-border" />
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {day.class_month?.classes?.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(day.date), 'EEE, MMM d')}
                                {day.start_time && ` • ${formatTime12h(day.start_time)}`}
                              </p>
                            </div>
                            {day.is_extra && (
                              <Badge variant="outline" className="text-xs shrink-0">Extra</Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* COMPLETED */}
              {pastClasses.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium text-muted-foreground">Completed</span>
                    <Badge variant="secondary" className="text-xs">{pastClasses.length}</Badge>
                  </div>
                  <div className="space-y-1">
                    {pastClasses.slice(0, 3).map((day) => (
                      <Link
                        key={day.id}
                        to={`/admin/classes/${day.class_month?.classes?.id}/content`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors opacity-70">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                            <p className="text-sm text-muted-foreground truncate">
                              {day.class_month?.classes?.title}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {format(parseISO(day.date), 'MMM d')}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default ClassScheduleChat;
