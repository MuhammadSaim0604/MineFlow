
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Cpu, Lock, Mail, User, UserPlus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isReferralDisabled, setIsReferralDisabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setReferralCode(code);
      setIsReferralDisabled(true);
      localStorage.setItem("pendingReferralCode", code);
    }
  }, []);

  const signupMutation = useMutation({
    mutationFn: (data: { username: string; email: string; password: string; referralCode?: string }) =>
      apiRequest("POST", "/api/auth/signup", data),
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.userId);
      toast({
        title: "Account created!",
        description: "Welcome to MineOS",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Signup failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    signupMutation.mutate({ 
      username, 
      email, 
      password, 
      referralCode: referralCode || undefined 
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 pb-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="relative rounded-3xl bg-white p-6 border border-border shadow-sm">
              <Cpu className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Get Started</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Create your mining account
            </p>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4 text-muted-foreground" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invited-by" className="flex items-center gap-2 text-sm font-medium">
                <UserPlus className="w-4 h-4 text-muted-foreground" />
                Invited By (Optional)
              </Label>
              <Input
                id="invited-by"
                type="text"
                placeholder="Referral Code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                disabled={isReferralDisabled}
                className={`h-12 font-mono ${isReferralDisabled ? 'bg-muted/50 cursor-not-allowed' : ''}`}
              />
              {isReferralDisabled && (
                <p className="text-[10px] text-primary font-medium px-1">Referral applied</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="flex items-center gap-2 text-sm font-medium">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Confirm Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={signupMutation.isPending}
              data-testid="button-signup"
            >
              {signupMutation.isPending ? "Creating account..." : "Create Account"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12"
              onClick={() => window.location.href = '/api/auth/google'}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </Button>
          </form>
        </Card>

        <div className="text-center space-y-4">
          <button
            onClick={() => setLocation("/login")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Already have an account?{" "}
            <span className="text-primary font-semibold">Sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
}
