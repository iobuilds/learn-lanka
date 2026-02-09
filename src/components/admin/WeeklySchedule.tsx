import { Calendar, Clock, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

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

const WeeklySchedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Calculate date range based on view mode
  const getDateRange = () => {
    if (viewMode === 'week') {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      };
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    }
  };

  const dateRange = getDateRange();

  // Fetch class days for the current period
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

  const navigatePrev = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Group class days by date
  const groupedByDate = classDays.reduce((acc, day) => {
    const dateKey = day.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(day);
    return acc;
  }, {} as Record<string, ClassDay[]>);

  const formatTimeRange = (startTime: string | null, endTime: string | null) => {
    if (!startTime) return null;
    const start = startTime.slice(0, 5);
    const end = endTime ? endTime.slice(0, 5) : null;
    return end ? `${start} - ${end}` : start;
  };

  const isToday = (dateStr: string) => {
    return format(new Date(), 'yyyy-MM-dd') === dateStr;
  };

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Class Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'week' | 'month')}>
              <TabsList className="h-8">
                <TabsTrigger value="week" className="text-xs px-2">Week</TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-2">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigatePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {viewMode === 'week' 
              ? `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`
              : format(currentDate, 'MMMM yyyy')
            }
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : classDays.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No classes scheduled for this {viewMode}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {Object.entries(groupedByDate).map(([dateStr, days]) => (
              <div key={dateStr} className={cn(
                "rounded-lg p-3",
                isToday(dateStr) ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "text-sm font-medium",
                    isToday(dateStr) && "text-primary"
                  )}>
                    {format(parseISO(dateStr), 'EEEE, MMM d')}
                  </span>
                  {isToday(dateStr) && (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                      Today
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {days.map((day) => (
                    <Link
                      key={day.id}
                      to={`/admin/classes/${day.class_month?.classes?.id}/content`}
                      className="block"
                    >
                      <div className={cn(
                        "flex items-center justify-between p-2 rounded-md bg-background hover:bg-muted transition-colors",
                        day.is_conducted && "opacity-60"
                      )}>
                        <div className="flex items-center gap-3 min-w-0">
                          <BookOpen className="w-4 h-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {day.class_month?.classes?.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {day.title}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {day.start_time && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeRange(day.start_time, day.end_time)}
                            </span>
                          )}
                          {day.is_conducted && (
                            <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                              Done
                            </Badge>
                          )}
                          {day.is_extra && (
                            <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                              Extra
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklySchedule;
