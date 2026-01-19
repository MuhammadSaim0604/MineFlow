import { Card } from "@/components/ui/card";
import { Users, Gift, Share2, Copy, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import type { User } from "@shared/schema";

export default function Referral() {
  const { toast } = useToast();
  
  const { data: user } = useQuery<{ referralCode: string }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: referrals = [] } = useQuery<User[]>({
    queryKey: ["/api/referrals"],
  });

  const { data: stats } = useQuery<{ count: number; earnings: string }>({
    queryKey: ["/api/referral/stats"],
  });

  const referralCode = user?.referralCode || "LOADING...";
  const referralLink = `https://mine-os.onrender.com/register/?ref_code=${referralCode}`;

  const copyToClipboard = (text: string, description: string) => {
    if (referralCode === "LOADING...") return;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: description,
    });
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Share2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Refer & Earn</h1>
        <p className="text-muted-foreground">Invite friends and get 10% of their mining earnings forever!</p>
      </div>

      <Card className="p-6 space-y-4 shadow-none border-none bg-primary/5">
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Your Referral Code</p>
            <div className="text-3xl font-mono font-bold tracking-wider text-primary">{referralCode}</div>
            <Button onClick={() => copyToClipboard(referralCode, "Referral code copied to clipboard")} variant="ghost" size="sm" className="mt-1 h-8 text-xs gap-2">
              <Copy className="w-3 h-3" />
              Copy Code
            </Button>
          </div>
          
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-2 text-center">Referral Link</p>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border">
              <div className="text-xs font-mono text-muted-foreground truncate flex-1">
                {referralLink}
              </div>
              <Button onClick={() => copyToClipboard(referralLink, "Referral link copied to clipboard")} size="icon" variant="ghost" className="h-8 w-8">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center space-y-1 shadow-none bg-muted/30">
          <Users className="w-5 h-5 mx-auto text-primary" />
          <div className="text-xl font-bold">{stats?.count || 0}</div>
          <p className="text-xs text-muted-foreground">Total Referrals</p>
        </Card>
        <Card className="p-4 text-center space-y-1 shadow-none bg-muted/30">
          <Gift className="w-5 h-5 mx-auto text-primary" />
          <div className="text-xl font-bold">{stats?.earnings || "0.0000"}</div>
          <p className="text-xs text-muted-foreground">BTC Earned</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-lg">My Referrals</h2>
        {referrals.length === 0 ? (
        <Card className="p-8 text-center bg-muted/20 border-none shadow-none">
            <p className="text-muted-foreground text-sm">No referrals yet. Start inviting!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref) => (
              <Card key={ref.id} className="p-4 flex items-center justify-between shadow-none bg-muted/10 border-none">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-primary/10">
                    <AvatarFallback className="bg-primary/5 text-primary text-xs">
                      {ref.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-sm">{ref.username}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Joined {format(new Date(ref.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-primary">Active</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
