
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, UserCircle, Check } from "lucide-react";

interface ReferralCodeSetupProps {
  open: boolean;
  onComplete: () => void;
}

export function ReferralCodeSetup({ open, onComplete }: ReferralCodeSetupProps) {
  const [step, setStep] = useState<"username" | "referral">("username");
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: open,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { username?: string; referralCode?: string }) =>
      apiRequest("POST", "/api/auth/update-profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      if (step === "username") {
        setStep("referral");
      } else {
        toast({
          title: "Profile updated",
          description: "Your account is ready!",
        });
        onComplete();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      toast({
        title: "Error",
        description: "Username must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate({ username });
  };

  const handleReferralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ referralCode: referralCode || undefined });
  };

  const handleSkipReferral = () => {
    onComplete();
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-background rounded-[32px]">
        <div className="p-8 space-y-8">
          {step === "username" ? (
            <>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserCircle className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-bold">Choose Username</DialogTitle>
                  <DialogDescription className="text-sm">
                    How should we call you? This will be visible to others.
                  </DialogDescription>
                </div>
              </div>

              <form onSubmit={handleUsernameSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium px-1">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    className="h-14 rounded-2xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg px-6"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover-elevate active-elevate-2"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "Setting..." : "Continue"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserPlus className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-bold">Have an Invite?</DialogTitle>
                  <DialogDescription className="text-sm">
                    Enter an invite code to get a starting bonus!
                  </DialogDescription>
                </div>
              </div>

              <form onSubmit={handleReferralSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="referral" className="text-sm font-medium px-1">Invite Code (Optional)</Label>
                  <Input
                    id="referral"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="e.g. AB1234"
                    className="h-14 rounded-2xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg px-6 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkipReferral}
                    className="h-14 rounded-2xl text-lg font-semibold text-muted-foreground hover:bg-muted/50"
                  >
                    Skip
                  </Button>
                  <Button
                    type="submit"
                    className="h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover-elevate active-elevate-2"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Applying..." : "Next"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
