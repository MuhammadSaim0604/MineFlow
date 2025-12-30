import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Check, ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function SetWalletPin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const setPinMutation = useMutation({
    mutationFn: (data: { pin: string }) =>
      apiRequest("POST", "/api/wallet/set-pin", data),
    onSuccess: () => {
      // Directly update the cache without refetching
      queryClient.setQueryData(["/api/wallet/has-pin"], { hasPin: true });
      
      toast({
        title: "PIN Set Successfully",
        description: "Your wallet is now secured",
      });
      
      // Navigate immediately
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Set PIN",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      setPin("");
      setConfirmPin("");
      setStep("create");
    },
  });

  const currentPin = step === "create" ? pin : confirmPin;
  const setCurrentPin = step === "create" ? setPin : setConfirmPin;

  const handleNumberClick = (num: string) => {
    if (currentPin.length < 4) {
      setCurrentPin(currentPin + num);
    }
  };

  const handleDelete = () => {
    setCurrentPin(currentPin.slice(0, -1));
  };

  const handleClear = () => {
    setCurrentPin("");
  };

  const handleNext = () => {
    if (step === "create" && pin.length === 4) {
      setStep("confirm");
    } else if (step === "confirm" && confirmPin.length === 4) {
      if (pin === confirmPin) {
        setPinMutation.mutate({ pin });
      } else {
        toast({
          title: "PINs Don't Match",
          description: "Please try again",
          variant: "destructive",
        });
        setConfirmPin("");
        setPin("");
        setStep("create");
      }
    }
  };

  const handleBack = () => {
    if (step === "confirm") {
      setConfirmPin("");
      setStep("create");
    }
  };

  if (currentPin.length === 4 && !setPinMutation.isPending) {
    setTimeout(handleNext, 300);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          disabled={step === "create"}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-between px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 w-full max-w-md">
          {/* Icon */}
          <div className="p-6 rounded-full bg-primary/10">
            <Lock className="w-12 h-12 text-primary" />
          </div>

          {/* Title & Description */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {step === "create" ? "Create PIN" : "Confirm PIN"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === "create"
                ? "Set a 4-digit PIN to secure your wallet"
                : "Re-enter your PIN to confirm"}
            </p>
          </div>

          {/* PIN Dots */}
          <div className="flex gap-4 justify-center">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  i < currentPin.length
                    ? "bg-primary scale-110"
                    : "bg-muted border-2 border-muted-foreground/20"
                }`}
                data-testid={`pin-dot-${i}`}
              />
            ))}
          </div>

          {/* Step Indicator */}
          <div className="flex gap-2">
            <div className={`h-1 w-8 rounded-full transition-all ${
              step === "create" ? "bg-primary" : "bg-muted"
            }`} />
            <div className={`h-1 w-8 rounded-full transition-all ${
              step === "confirm" ? "bg-primary" : "bg-muted"
            }`} />
          </div>
        </div>

        {/* Numeric Keypad */}
        <div className="w-full max-w-xs space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                variant="outline"
                size="lg"
                onClick={() => handleNumberClick(num.toString())}
                className="h-16 text-2xl font-semibold rounded-full hover-elevate"
                disabled={currentPin.length >= 4 || setPinMutation.isPending}
                data-testid={`button-num-${num}`}
              >
                {num}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleClear}
              className="h-16 text-sm rounded-full"
              disabled={currentPin.length === 0 || setPinMutation.isPending}
              data-testid="button-clear"
            >
              Clear
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleNumberClick("0")}
              className="h-16 text-2xl font-semibold rounded-full hover-elevate"
              disabled={currentPin.length >= 4 || setPinMutation.isPending}
              data-testid="button-num-0"
            >
              0
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleDelete}
              className="h-16 text-sm rounded-full"
              disabled={currentPin.length === 0 || setPinMutation.isPending}
              data-testid="button-delete"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          {setPinMutation.isPending ? "Setting up your PIN..." : "Your PIN is securely encrypted"}
        </p>
      </div>
    </div>
  );
}
