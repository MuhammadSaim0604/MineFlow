
import { useState, useEffect } from "react";
import { Play, Pause, Square, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MiningControlProps {
  status: "idle" | "active" | "paused" | "cooldown";
  duration: number;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

export function MiningControl({ status, duration, onStart, onPause, onStop }: MiningControlProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);

    if (status === "idle" || status === "cooldown") {
      onStart();
    } else if (status === "active") {
      onPause();
    } else if (status === "paused") {
      onPause();
    }
  };

  const getButtonStyles = () => {
    switch (status) {
      case "active":
        return "bg-primary text-primary-foreground shadow-lg shadow-primary/50 scale-100";
      case "paused":
        return "bg-chart-3 text-primary-foreground shadow-lg shadow-chart-3/50 scale-100";
      case "cooldown":
        return "bg-muted text-muted-foreground cursor-not-allowed scale-95";
      default:
        return "bg-card border-2 border-primary text-primary hover-elevate active-elevate-2 scale-100";
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress for 24 hours (86400 seconds)
  const totalSeconds = 86400; // 24 hours
  const progress = status === "active" || status === "paused" ? (duration / totalSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex items-center justify-center w-52 h-52">
        <svg className="absolute w-52 h-52 -rotate-90 transition-all duration-500">
          <circle
            cx="104"
            cy="104"
            r="90"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted opacity-20"
          />
          {(status === "active" || status === "paused") && (
            <circle
              cx="104"
              cy="104"
              r="90"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className={`${status === "active" ? "text-primary" : "text-chart-3"} transition-all duration-500 ease-out`}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          )}
        </svg>

        <button
          onClick={handleClick}
          data-testid="button-mining-control"
          className={`relative w-36 h-36 rounded-full flex flex-col items-center justify-center font-bold overflow-hidden transition-all duration-500 ease-out ${getButtonStyles()}`}
          disabled={status === "cooldown"}
        >
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              className="absolute w-4 h-4 bg-white/50 rounded-full animate-ripple pointer-events-none"
              style={{
                left: ripple.x - 8,
                top: ripple.y - 8,
              }}
            />
          ))}
          
          {/* Energy particles animation for active state */}
          {status === "active" && (
            <>
              <Zap className="absolute top-4 left-8 w-3 h-3 text-primary-foreground/40 animate-ping" style={{ animationDuration: '1.5s' }} />
              <Zap className="absolute top-8 right-6 w-2 h-2 text-primary-foreground/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
              <Zap className="absolute bottom-6 left-6 w-2 h-2 text-primary-foreground/30 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.6s' }} />
            </>
          )}

          <div className={`text-2xl font-mono font-semibold mb-1 transition-all duration-300 ${
            status === "active" ? "animate-pulse" : ""
          }`}>
            {formatDuration(duration)}
          </div>
          <div className="flex items-center gap-2 text-sm transition-all duration-300">
            {status === "idle" || status === "cooldown" ? (
              <>
                <Zap className={`w-4 h-4 transition-transform duration-300 ${status === "idle" ? "group-hover:scale-110" : ""}`} fill="currentColor" />
                <span>START</span>
              </>
            ) : status === "active" ? (
              <>
                <Pause className="w-4 h-4 transition-transform duration-300" fill="currentColor" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 transition-transform duration-300" fill="currentColor" />
                <span>RESUME</span>
              </>
            )}
          </div>
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 transition-all duration-300">
        <div className="text-sm text-muted-foreground capitalize transition-all duration-300" data-testid="text-mining-status">
          {status === "cooldown" ? "Cooling down..." : `24-Hour Session • ${status}`}
        </div>
        <div className="text-xs text-muted-foreground transition-all duration-300">
          {progress.toFixed(1)}% Complete
        </div>
      </div>

      {status === "paused" && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onStop}
          data-testid="button-stop-mining"
          className="gap-2 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <Square className="w-4 h-4" />
          Stop Session
        </Button>
      )}
    </div>
  );
}
