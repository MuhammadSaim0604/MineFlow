
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
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UsernameSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

export function UsernameSetupModal({ open, onComplete }: UsernameSetupModalProps) {
  const [username, setUsername] = useState("");
  const { toast } = useToast();

  const updateUsernameMutation = useMutation({
    mutationFn: (newUsername: string) =>
      apiRequest("POST", "/api/auth/update-username", { username: newUsername }),
    onSuccess: () => {
      toast({
        title: "Username set",
        description: "Your username has been set successfully",
      });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set username",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      toast({
        title: "Error",
        description: "Username must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }
    updateUsernameMutation.mutate(username);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Your Username</DialogTitle>
          <DialogDescription>
            Please set a username for your account. This will be visible to others.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={updateUsernameMutation.isPending}
          >
            {updateUsernameMutation.isPending ? "Setting..." : "Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
