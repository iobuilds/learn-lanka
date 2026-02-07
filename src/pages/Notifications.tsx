import { Link } from 'react-router-dom';
import { Bell, CheckCircle, Clock, BookOpen, CreditCard, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StudentLayout from '@/components/layouts/StudentLayout';
import { mockNotifications } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const Notifications = () => {
  const getIcon = (title: string) => {
    if (title.toLowerCase().includes('rank') || title.toLowerCase().includes('paper')) {
      return FileText;
    }
    if (title.toLowerCase().includes('payment')) {
      return CreditCard;
    }
    if (title.toLowerCase().includes('class') || title.toLowerCase().includes('schedule')) {
      return BookOpen;
    }
    return Bell;
  };

  return (
    <StudentLayout>
      <div className="section-spacing max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with class announcements
            </p>
          </div>
          <Button variant="outline" size="sm">
            Mark all as read
          </Button>
        </div>

        <div className="space-y-3">
          {mockNotifications.map((notification, index) => {
            const Icon = getIcon(notification.title);
            const isRead = index > 0; // Mock: first one is unread

            return (
              <Card 
                key={notification.id} 
                className={cn(
                  "card-elevated transition-colors",
                  !isRead && "border-primary/50 bg-primary/5"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      isRead ? "bg-muted" : "bg-primary/10"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        isRead ? "text-muted-foreground" : "text-primary"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={cn(
                          "font-medium",
                          isRead ? "text-foreground" : "text-primary"
                        )}>
                          {notification.title}
                        </h3>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notification.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {mockNotifications.length === 0 && (
            <Card className="card-elevated">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground mb-2">No notifications</h3>
                <p className="text-sm text-muted-foreground">You're all caught up!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default Notifications;
