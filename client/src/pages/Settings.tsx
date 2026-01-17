import { SettingsPanel } from "@/components/SettingsPanel";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import type { UserSettings } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: settings, isLoading, isError, error } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
    retry: 3,
    retryDelay: 1000,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: any) => 
      apiRequest("PUT", "/api/settings", newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSettingsChange = (newSettings: any) => {
    updateSettingsMutation.mutate(newSettings);
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your mining preferences</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-destructive" data-testid="text-error">
            {(error as any)?.message || "Failed to load settings"}
          </p>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/settings"] })}
            data-testid="button-retry"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your mining preferences</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 max-w-md mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your mining preferences</p>
        </div>
      </div>

      <SettingsPanel settings={settings} onSettingsChange={handleSettingsChange} />
    </div>
  );
}
