import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpRight, ArrowDownRight, Copy, QrCode, Wallet as WalletIcon, History, Eye, EyeOff, Send } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { VerifyPinDialog } from "@/components/VerifyPinDialog";
import type { Transaction } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Wallet() {
  const { toast } = useToast();
  const [sendAmount, setSendAmount] = useState("");
  const [sendRecipient, setSendRecipient] = useState("");
  const [showBalance, setShowBalance] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);

  const { data: userData } = useQuery<{ walletAddress?: string }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: balance = "0.00000000", isLoading: isLoadingBalance } = useQuery<string>({
    queryKey: ["/api/balance"],
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const transferMutation = useMutation({
    mutationFn: (data: { recipient: string; amount: string }) =>
      apiRequest("POST", "/api/transfer", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Transfer Successful",
        description: `Sent ${sendAmount} BTC successfully`,
      });
      setSendAmount("");
      setSendRecipient("");
    },
    onError: (error: any) => {
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to send transfer",
        variant: "destructive",
      });
    },
  });

  const handleCopyAddress = () => {
    if (userData?.walletAddress) {
      navigator.clipboard.writeText(userData.walletAddress);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const handleSend = async () => {
    if (!sendAmount || !sendRecipient) {
      toast({
        title: "Invalid Input",
        description: "Please enter both recipient and amount",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Show PIN dialog before sending
    setShowPinDialog(true);
  };

  const handlePinVerified = () => {
    transferMutation.mutate({
      recipient: sendRecipient,
      amount: sendAmount,
    });
  };

  const getIcon = (type: string) => {
    if (type === "transfer_send") return <ArrowUpRight className="w-4 h-4" />;
    if (type === "transfer_receive") return <ArrowDownRight className="w-4 h-4" />;
    if (type.includes("deposit")) return <ArrowDownRight className="w-4 h-4" />;
    if (type.includes("withdrawal")) return <ArrowUpRight className="w-4 h-4" />;
    return <WalletIcon className="w-4 h-4" />;
  };

  const getColor = (type: string) => {
    if (type === "transfer_send" || type === "withdrawal") return "text-red-500 bg-red-50";
    if (type === "transfer_receive" || type === "deposit") return "text-green-500 bg-green-50";
    return "text-muted-foreground bg-muted";
  };

  const getDisplayType = (type: string) => {
    if (type === "transfer_send") return "Sent";
    if (type === "transfer_receive") return "Received";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const isNegative = (type: string, amount: string) => {
    return type === "transfer_send" || type === "withdrawal" || amount.startsWith("-");
  };

  if (isLoadingBalance || isLoadingTransactions) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-md mx-auto">
        <div className="space-y-4">
          <div className="h-40 bg-muted rounded-xl animate-pulse" />
          <div className="h-96 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 space-y-6 max-w-md mx-auto pb-24">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-wallet-title">Wallet</h1>
        <p className="text-sm text-muted-foreground">Manage your crypto assets</p>
      </div>

      {/* Balance Card */}
      <Card className="p-6 bg-primary/5 border-primary/20 shadow-none">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <div className="flex items-center gap-3">
            {showBalance ? (
              <>
                <h2 className="text-4xl font-bold font-mono text-foreground" data-testid="text-balance">
                  {balance}
                </h2>
                <span className="text-lg text-muted-foreground">BTC</span>
              </>
            ) : (
              <h2 className="text-4xl font-bold text-foreground">••••••••</h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowBalance(!showBalance)}
              data-testid="button-toggle-balance"
              className="ml-2 hover:bg-primary/10"
            >
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
          </div>
          {showBalance && (
            <p className="text-sm text-muted-foreground">
              ≈ ${(parseFloat(balance) * 65000).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
            </p>
          )}
        </div>
      </Card>

      {/* Send & Receive Tabs */}
      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send" data-testid="tab-send">
            <Send className="w-4 h-4 mr-2" />
            Send
          </TabsTrigger>
          <TabsTrigger value="receive" data-testid="tab-receive">
            <ArrowDownRight className="w-4 h-4 mr-2" />
            Receive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4 mt-4">
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sendRecipient">Recipient</Label>
              <Input
                id="sendRecipient"
                data-testid="input-recipient"
                placeholder="Username, email, or wallet address"
                value={sendRecipient}
                onChange={(e) => setSendRecipient(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter username, email, or wallet address (WAL...)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sendAmount">Amount (BTC)</Label>
              <Input
                id="sendAmount"
                data-testid="input-amount"
                type="number"
                step="0.00000001"
                placeholder="0.00000000"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available: {balance} BTC
              </p>
            </div>
            <Button 
              onClick={handleSend} 
              className="w-full" 
              disabled={transferMutation.isPending}
              data-testid="button-send"
            >
              {transferMutation.isPending ? (
                <>Processing...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send BTC
                </>
              )}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="receive" className="space-y-4 mt-4">
          <Card className="p-6 space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-xl">
                <QrCode className="w-32 h-32 text-black" />
              </div>
              <div className="w-full space-y-2">
                <Label>Your Wallet Address</Label>
                <div className="flex gap-2">
                  <Input
                    value={userData?.walletAddress || "Loading..."}
                    readOnly
                    className="font-mono text-sm"
                    data-testid="input-wallet-address"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyAddress}
                    disabled={!userData?.walletAddress}
                    data-testid="button-copy-address"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction History */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Transaction History</h3>
          <History className="w-5 h-5 text-muted-foreground" />
        </div>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {transactions.filter(tx => tx.type !== "mining").length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <WalletIcon className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No transactions yet</p>
                <p className="text-xs text-muted-foreground/70">Send or receive BTC to see history</p>
              </div>
            ) : (
              transactions
                .filter(tx => tx.type !== "mining")
                .map((tx) => (
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
                        {getDisplayType(tx.type)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {tx.description || formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-mono font-semibold ${
                        isNegative(tx.type, tx.amount) ? "text-red-500" : "text-green-500"
                      }`}>
                        {isNegative(tx.type, tx.amount) ? "" : "+"}{tx.amount}
                      </div>
                      <div className="text-xs text-muted-foreground">BTC</div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </ScrollArea>
      </Card>

      <VerifyPinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onSuccess={handlePinVerified}
      />
    </div>
  );
}
