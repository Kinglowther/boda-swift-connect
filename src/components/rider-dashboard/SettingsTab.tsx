
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface SettingsTabProps {
  locationEnabled: boolean;
  handleLocationToggle: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  handleNotificationToggle: (enabled: boolean) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  locationEnabled,
  handleLocationToggle,
  notificationsEnabled,
  handleNotificationToggle,
}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-foreground">Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">App Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="location-access" className="text-base font-medium text-foreground">
                Location Access
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow the app to access your location for accurate order tracking
              </p>
            </div>
            <Switch
              id="location-access"
              checked={locationEnabled}
              onCheckedChange={handleLocationToggle}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="push-notifications" className="text-base font-medium text-foreground">
                Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about new order requests and updates
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;

