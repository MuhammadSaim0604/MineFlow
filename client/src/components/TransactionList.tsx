import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDownRight, ArrowUpRight, Cpu, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

interface Transaction {
  id: string;
  type: "mining" | "deposit" | "withdrawal";
  amount: string;
  description: string | null;
  createdAt: string;
  status: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const [, setLocation] = useLocation();

  const getIcon = (type: string) => {
    switch (type) {
      case "mining":
        return <Cpu className="w-4 h-4" />;
      case "deposit":
        return <ArrowDownRight className="w-4 h-4" />;
      case "withdrawal":
        return <ArrowUpRight className="w-4 h-4" />;
      default:
        return <Cpu className="w-4 h-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "mining":
        return "text-primary bg-primary/10";
      case "deposit":
        return "text-chart-2 bg-chart-2/10";
      case "withdrawal":
        return "text-chart-3 bg-chart-3/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
        <button
          onClick={() => setLocation("/history")}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="View full history"
        >
          <History className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
      <ScrollArea className="h-80">
        <div className="space-y-3" data-testid="list-transactions">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Cpu className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground/70">Start mining to see your earnings</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div 
                key={tx.id} 
                className="flex items-center gap-3 p-3 rounded-lg hover-elevate transition-all" 
                data-testid={`transaction-${tx.id}`}
              >
                <div className={`p-2 rounded-lg ${getColor(tx.type)}`}>
                  {getIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground capitalize">
                    {tx.type}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {tx.description || formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-mono font-semibold ${
                    tx.type === "withdrawal" ? "text-chart-3" : "text-chart-2"
                  }`}>
                    {tx.type === "withdrawal" ? "-" : "+"}{tx.amount}
                  </div>
                  <div className="text-xs text-muted-foreground">BTC</div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
