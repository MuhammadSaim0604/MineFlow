
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
  duration: number;
  earnings: string;
  status: string;
  hashRate: string;
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
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
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
      <Card className="p-4">
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
                className="p-4 hover-elevate transition-all cursor-pointer"
                data-testid={`session-${session.id}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Cpu className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground truncate">
                            Session {session.id.slice(0, 8)}
                          </span>
                          <Badge className={getStatusColor(session.status)} variant="secondary">
                            {session.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.startTime), { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-mono font-semibold text-chart-2">
                        +{session.earnings}
                      </div>
                      <div className="text-xs text-muted-foreground">BTC</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <div className="text-xs text-muted-foreground">Duration</div>
                        <div className="text-sm font-medium text-foreground">
                          {formatDuration(session.duration)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <div className="text-xs text-muted-foreground">Hash Rate</div>
                        <div className="text-sm font-medium text-foreground">
                          {session.hashRate} MH/s
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
