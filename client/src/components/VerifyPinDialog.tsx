import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface VerifyPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function VerifyPinDialog({ open, onOpenChange, onSuccess }: VerifyPinDialogProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const verifyPinMutation = useMutation({
    mutationFn: (data: { pin: string }) =>
      apiRequest("POST", "/api/wallet/verify-pin", data),
    onSuccess: () => {
      setPin("");
      setError("");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      setError(error.message || "Invalid PIN");
      setPin("");
    },
  });

  const handleSubmit = () => {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    setError("");
    verifyPinMutation.mutate({ pin });
  };

  const handleClose = () => {
    setPin("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Verify Your PIN
          </DialogTitle>
          <DialogDescription>
            Enter your 4-digit wallet PIN to continue with this transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="verifyPin">PIN</Label>
            <Input
              id="verifyPin"
              data-testid="input-verify-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              className="text-center text-2xl tracking-widest"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              data-testid="button-cancel-pin"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={verifyPinMutation.isPending || pin.length !== 4}
              data-testid="button-verify-pin"
            >
              {verifyPinMutation.isPending ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
