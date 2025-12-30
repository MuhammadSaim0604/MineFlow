import { useEffect, useState } from "react";
import { Cpu } from "lucide-react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="relative flex flex-col items-center gap-8">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse-glow rounded-full bg-primary/20 blur-3xl" />
          <div className="relative rounded-3xl bg-card p-8 border border-card-border">
            <Cpu className="h-16 w-16 text-primary animate-pulse-glow" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <h1 className="text-4xl font-bold text-foreground">MineOS</h1>
          <p className="text-sm text-muted-foreground">Smart Mining Dashboard</p>
        </div>

        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
