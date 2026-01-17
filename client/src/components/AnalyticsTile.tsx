import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface AnalyticsTileProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  unit: string;
  color?: string;
  trend?: "up" | "down" | "stable";
}

export function AnalyticsTile({ icon: Icon, label, value, unit, color = "text-primary", trend }: AnalyticsTileProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayValue !== value) {
      setIsAnimating(true);
      setDisplayValue(value);
      setTimeout(() => setIsAnimating(false), 800);
    }
  }, [value, displayValue]);

  return (
    <Card className="p-4 flex flex-col gap-3 shadow-none border-none bg-card rounded-2xl" data-testid={`tile-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center justify-between">
        <Icon className={`w-5 h-5 ${color}`} />
        {trend && (
          <div className={`text-xs font-medium ${
            trend === "up" ? "text-chart-2" : trend === "down" ? "text-destructive" : "text-muted-foreground"
          }`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
        <div className={`text-2xl font-mono font-semibold text-foreground ${isAnimating ? "animate-count-up" : ""}`} data-testid={`value-${label.toLowerCase().replace(/\s/g, '-')}`}>
          {displayValue}
          <span className="text-sm ml-1 text-muted-foreground">{unit}</span>
        </div>
      </div>
    </Card>
  );
}
