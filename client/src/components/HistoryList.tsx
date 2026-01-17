
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Clock, TrendingUp, Cpu, Zap } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface Session {
  id: string;
  startTime: string;
  endTime: string | null;
  duration?: number;
  pausedDuration?: number;
  earnings: string;
  status: string;
  intensity?: number;
  hashRate?: string;
}

interface HistoryListProps {
  sessions: Session[];
}

export function HistoryList({ sessions }: HistoryListProps) {
  const [search, setSearch] = useState("");

  const filteredSessions = sessions.filter((session) =>
    session.id.toLowerCase().includes(search.toLowerCase()) ||
    session.status.toLowerCase().includes(search.toLowerCase())
  );

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0m";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const calculateSessionDuration = (session: Session) => {
    if (session.duration) return session.duration;
    if (!session.endTime) return 0;
    
    const start = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();
    const totalSeconds = Math.floor((end - start) / 1000);
    return Math.max(0, totalSeconds - (session.pausedDuration || 0));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-chart-2 text-white";
      case "paused":
        return "bg-chart-3 text-white";
      case "stopped":
        return "bg-muted text-muted-foreground";
      case "cooldown":
        return "bg-chart-4 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30 border-none">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-sessions"
            className="pl-9"
          />
        </div>
      </Card>

      <ScrollArea className="h-[calc(100vh-420px)]">
        <div className="space-y-3">
          {filteredSessions.length === 0 ? (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {search ? "No sessions found" : "No mining sessions yet"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {search ? "Try a different search term" : "Start mining to see your history"}
                </p>
              </div>
            </Card>
          ) : (
            filteredSessions.map((session) => (
              <Card 
                key={session.id} 
                className="p-3 sm:p-4 hover-elevate transition-all cursor-pointer w-full"
                data-testid={`session-${session.id}`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-row items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                        <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
                          <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                            S-{session.id.slice(0, 8)}
                          </span>
                          <Badge className={`${getStatusColor(session.status)} text-[9px] sm:text-xs px-1 sm:px-2 py-0`} variant="secondary">
                            {session.status}
                          </Badge>
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {formatDistanceToNow(new Date(session.startTime), { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-lg font-mono font-semibold text-chart-2 whitespace-nowrap">
                        +{session.earnings}
                      </div>
                      <div className="text-[9px] sm:text-xs text-muted-foreground uppercase">BTC</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[9px] sm:text-xs text-muted-foreground truncate uppercase tracking-tighter">Duration</div>
                        <div className="text-[11px] sm:text-sm font-medium text-foreground truncate">
                          {formatDuration(calculateSessionDuration(session))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[9px] sm:text-xs text-muted-foreground truncate uppercase tracking-tighter">Hash Rate</div>
                        <div className="text-[11px] sm:text-sm font-medium text-foreground truncate">
                          {session.intensity ? (session.intensity * 0.45).toFixed(2) : "0.00"} MH/s
                        </div>
                      </div>
                    </div>
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
