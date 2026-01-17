import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Check, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";
import { useLocation } from "wouter";

export default function NotificationsPage() {
  const [, setLocation] = useLocation();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 5000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/notifications", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "session_start": return "🚀";
      case "session_stop": return "⏹️";
      case "low_balance": return "⚠️";
      case "alert": return "🔔";
      default: return "ℹ️";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-md mx-auto flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center gap-4 bg-background sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="h-8 w-8">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold flex-1">Notifications</h1>
        {notifications.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => clearAllMutation.mutate()}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bell className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No notifications yet</h3>
              <p className="text-sm text-muted-foreground max-w-[200px] mt-2">
                We'll notify you when something important happens.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`p-4 transition-all border shadow-none ${
                  !notification.isRead ? "bg-primary/5 border-primary/20" : "bg-white"
                }`}
                onClick={() => !notification.isRead && markAsReadMutation.mutate(notification.id)}
              >
                <div className="flex gap-4">
                  <div className="text-2xl bg-muted w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-semibold text-foreground ${!notification.isRead ? "" : "opacity-80"}`}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className={`text-sm text-muted-foreground mt-1 line-clamp-2 ${!notification.isRead ? "" : "opacity-70"}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
