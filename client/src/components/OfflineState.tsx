import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw } from "lucide-react";

export function OfflineState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <Card className="max-w-md mx-4 p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-muted">
            <WifiOff className="w-12 h-12 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Connection Lost</h3>
          <p className="text-sm text-muted-foreground">
            Unable to connect to the server. Please check your internet connection and try again.
          </p>
        </div>

        <Button 
          onClick={onRetry} 
          className="w-full gap-2"
          data-testid="button-retry-connection"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </Button>
      </Card>
    </div>
  );
}
