import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Battery, Bell, Volume2, Zap } from "lucide-react";

interface SettingsPanelProps {
  settings: {
    miningIntensity: number;
    energySaverMode: boolean;
    notifications: boolean;
    sound: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Mining Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="intensity" className="text-sm font-medium">
                Mining Intensity
              </Label>
              <span className="text-sm font-mono text-muted-foreground" data-testid="text-intensity-value">
                {settings.miningIntensity}%
              </span>
            </div>
            <Slider
              id="intensity"
              data-testid="slider-mining-intensity"
              min={10}
              max={100}
              step={10}
              value={[settings.miningIntensity]}
              onValueChange={(value) => 
                onSettingsChange({ ...settings, miningIntensity: value[0] })
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher intensity increases hash rate but uses more power
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Battery className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Power & Performance</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="energy-saver" className="text-sm font-medium">
                Energy Saver Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Reduces animations and power usage
              </p>
            </div>
            <Switch
              id="energy-saver"
              data-testid="switch-energy-saver"
              checked={settings.energySaverMode}
              onCheckedChange={(checked) => 
                onSettingsChange({ ...settings, energySaverMode: checked })
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications" className="text-sm font-medium">
                Enable Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Get alerts for session events and balance changes
              </p>
            </div>
            <Switch
              id="notifications"
              data-testid="switch-notifications"
              checked={settings.notifications}
              onCheckedChange={(checked) => 
                onSettingsChange({ ...settings, notifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="sound" className="text-sm font-medium">
                Sound Effects
              </Label>
            </div>
            <Switch
              id="sound"
              data-testid="switch-sound"
              checked={settings.sound}
              onCheckedChange={(checked) => 
                onSettingsChange({ ...settings, sound: checked })
              }
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
