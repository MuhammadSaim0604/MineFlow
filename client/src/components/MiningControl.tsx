import { useState } from "react";
import { Play, Pause, Square, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MiningControlProps {
  status: "idle" | "active" | "paused" | "cooldown";
  duration: number;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

export function MiningControl({
  status,
  duration,
  onStart,
  onPause,
  onStop,
}: MiningControlProps) {

  const handleClick = () => {
    if (status === "idle" || status === "cooldown") {
      onStart();
    } 
    else if (status === "active" || status === "paused") {
      onPause();
    }
  };

  const getButtonStyles = () => {
    switch (status) {
      case "active":
        return "bg-primary text-primary-foreground";
      case "paused":
        return "bg-orange-500 text-white";
      case "cooldown":
        return "bg-muted text-muted-foreground cursor-not-allowed";
      default:
        return "bg-white border-2 border-primary text-primary";
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Progress (24 hours)
  const totalSeconds = 86400;
  const progress =
    status === "active" || status === "paused"
      ? (duration / totalSeconds) * 100
      : 0;

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6">

      {/* Progress Circle */}
      <div className="relative flex items-center justify-center w-52 h-52">

        <svg className="absolute w-52 h-52 -rotate-90">
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
              className={
                status === "active"
                  ? "text-primary"
                  : "text-orange-500"
              }
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Main Button */}
        <button
          onClick={handleClick}
          data-testid="button-mining-control"
          disabled={status === "cooldown"}
          className={`w-36 h-36 rounded-full flex flex-col items-center justify-center font-bold ${getButtonStyles()}`}
        >

          {/* Timer */}
          <div className="text-2xl font-mono font-semibold mb-1">
            {formatDuration(duration)}
          </div>

          {/* Button Text */}
          <div className="flex items-center gap-2 text-sm">

            {status === "idle" || status === "cooldown" ? (
              <>
                <Zap className="w-4 h-4" fill="currentColor" />
                <span>START</span>
              </>
            ) : status === "active" ? (
              <>
                <Pause className="w-4 h-4" fill="currentColor" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" fill="currentColor" />
                <span>RESUME</span>
              </>
            )}

          </div>
        </button>

      </div>

      {/* Status */}
      <div className="flex flex-col items-center gap-2">

        <div
          className="text-sm text-muted-foreground capitalize"
          data-testid="text-mining-status"
        >
          {status === "cooldown"
            ? "Cooling down..."
            : `24-Hour Session • ${status}`}
        </div>

        <div className="text-xs text-muted-foreground">
          {progress.toFixed(1)}% Complete
        </div>

      </div>

      {/* Stop Button */}
      {status === "paused" && (
        <Button
          variant="outline"
          size="sm"
          onClick={onStop}
          data-testid="button-stop-mining"
          className="gap-2"
        >
          <Square className="w-4 h-4" />
          Stop Session
        </Button>
      )}
    </div>
  );
}
