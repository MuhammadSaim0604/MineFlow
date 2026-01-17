import { HistoryList } from "@/components/HistoryList";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cpu, TrendingUp, Clock, ArrowLeft } from "lucide-react";

export default function History() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["/api/sessions"],
  });

  // Calculate statistics
  const totalEarnings = sessions
    .reduce((acc: number, session: any) => {
      const earnings = parseFloat(session.earnings || "0");
      return acc + earnings;
    }, 0)
    .toFixed(8);

  const totalDuration = sessions.reduce((acc: number, session: any) => {
    let duration = 0;
    if (session.duration) {
      duration = parseInt(session.duration);
    } else if (session.startTime && session.endTime) {
      const start = new Date(session.startTime).getTime();
      const end = new Date(session.endTime).getTime();
      duration =
        Math.floor((end - start) / 1000) - (session.pausedDuration || 0);
    }
    return acc + Math.max(0, duration);
  }, 0);

  const formatTotalDuration = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const activeSessions = sessions.filter(
    (s: any) => s.status === "active" || s.status === "paused",
  ).length;
  const completedSessions = sessions.filter(
    (s: any) => s.status === "stopped",
  ).length;
  const totalSessions = sessions.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Mining History</h1>
          <p className="text-sm text-muted-foreground">
            View all your mining sessions
          </p>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-32 bg-muted rounded-xl" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 space-y-4 max-w-md mx-auto">
      <div className="mb-2 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mining History</h1>
          <p className="text-sm text-muted-foreground">
            Track your mining performance
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Total Earned</div>
            <div className="text-sm font-mono font-semibold text-chart-2 leading-tight">
              {totalEarnings}
            </div>
            <div className="text-xs text-muted-foreground">BTC</div>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-chart-3/10">
              <Clock className="w-4 h-4 text-chart-3" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Total Time</div>
            <div className="text-sm font-semibold text-foreground">
              {formatTotalDuration(totalDuration)}
            </div>
            <div className="text-xs text-muted-foreground">Mining time</div>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-chart-4/10">
              <Cpu className="w-4 h-4 text-chart-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Sessions</div>
            <div className="text-sm font-semibold text-foreground">
              {totalSessions}
            </div>
            <div className="flex gap-1 flex-wrap">
              {activeSessions > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs px-1.5 py-0 bg-chart-2/20 text-chart-2"
                >
                  {activeSessions} active
                </Badge>
              )}
              {completedSessions > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs px-1.5 py-0 bg-muted text-muted-foreground"
                >
                  {completedSessions} done
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </div>

      <HistoryList sessions={sessions} />
    </div>
  );
}
