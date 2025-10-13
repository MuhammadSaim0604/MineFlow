import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Cookie, Eye } from "lucide-react";

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
}

export function ConsentModal({ open, onAccept }: ConsentModalProps) {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const handleAccept = () => {
    localStorage.setItem("consent", JSON.stringify({
      essential: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
    }));
    onAccept();
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" data-testid="modal-consent">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Privacy & Consent
          </DialogTitle>
          <DialogDescription>
            We care about your privacy. Please review and accept our data collection preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted">
            <Cookie className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <Label className="text-sm font-medium">Essential Cookies</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Required for the app to function properly
              </p>
              <p className="text-xs text-primary mt-1">Always Active</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg hover-elevate transition-all">
            <Checkbox
              id="analytics"
              checked={analytics}
              onCheckedChange={(checked) => setAnalytics(checked as boolean)}
              data-testid="checkbox-analytics"
            />
            <div className="flex-1">
              <Label htmlFor="analytics" className="text-sm font-medium cursor-pointer">
                Analytics & Performance
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Help us improve your mining experience
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg hover-elevate transition-all">
            <Checkbox
              id="marketing"
              checked={marketing}
              onCheckedChange={(checked) => setMarketing(checked as boolean)}
              data-testid="checkbox-marketing"
            />
            <div className="flex-1">
              <Label htmlFor="marketing" className="text-sm font-medium cursor-pointer">
                Marketing & Communications
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Receive updates about new features
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleAccept} className="w-full sm:w-auto" data-testid="button-reject-all">
            Reject Optional
          </Button>
          <Button 
            onClick={() => {
              setAnalytics(true);
              setMarketing(true);
              setTimeout(handleAccept, 100);
            }}
            className="w-full sm:w-auto"
            data-testid="button-accept-all"
          >
            Accept All
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </DialogContent>
    </Dialog>
  );
}
