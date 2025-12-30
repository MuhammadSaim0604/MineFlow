import { Card } from "@/components/ui/card";
import { TrendingUp, Coins } from "lucide-react";

interface IncomeCardProps {
  balance: string;
  sessionEarnings: string;
  projectedDaily: string;
  percentageChange?: number;
}

export function IncomeCard({ balance, sessionEarnings, projectedDaily, percentageChange = 0 }: IncomeCardProps) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Total Balance</h3>
        <Coins className="w-5 h-5 text-primary" />
      </div>

      <div className="space-y-2">
        <div className="text-4xl font-mono font-bold text-foreground" data-testid="text-balance">
          {balance}
          <span className="text-lg ml-2 text-muted-foreground">BTC</span>
        </div>
        <div className="text-sm text-muted-foreground">≈ ${(parseFloat(balance) * 65000).toFixed(2)} USD</div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Session Earnings</div>
          <div className="text-lg font-mono font-semibold text-green-600 flex items-center gap-1" data-testid="text-session-earnings">
            <TrendingUp className="w-4 h-4" />
            {sessionEarnings} BTC
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Est. 24h</div>
          <div className="text-lg font-mono font-semibold text-foreground" data-testid="text-projected-earnings">
            {projectedDaily} BTC
          </div>
        </div>
      </div>

      {percentageChange !== 0 && (
        <div className={`text-sm font-medium ${percentageChange > 0 ? "text-green-600" : "text-red-500"}`}>
          {percentageChange > 0 ? "+" : ""}{percentageChange.toFixed(2)}% from last session
        </div>
      )}
    </Card>
  );
}