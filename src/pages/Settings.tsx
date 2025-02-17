import { VerificationRequest } from "@/components/verification/VerificationRequest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Bell, Shield, User, Lock } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  [key: string]: boolean; // Add index signature
}

interface PrivacyPreferences {
  profileVisibility: string;
  showLocation: boolean;
  showAvailability: boolean;
  [key: string]: boolean | string; // Add index signature
}

interface Settings {
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
}

const defaultSettings: Settings = {
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  privacy: {
    profileVisibility: "public",
    showLocation: false,
    showAvailability: true,
  },
};

const Settings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const { toast } = useToast();

  const updateSettings = async (newSettings: Settings) => {
    try {
      const notificationPrefs = newSettings.notifications as unknown as { [key: string]: Json };
      const privacyPrefs = newSettings.privacy as unknown as { [key: string]: Json };
      
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: notificationPrefs,
          privacy_preferences: privacyPrefs,
        })
        .single();

      if (error) throw error;

      setSettings(newSettings);
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences, privacy_preferences')
        .single();

      if (profile) {
        try {
          const notificationPrefs = profile.notification_preferences as { [key: string]: Json };
          const privacyPrefs = profile.privacy_preferences as { [key: string]: Json };

          if (notificationPrefs && typeof notificationPrefs === 'object') {
            setSettings(prev => ({
              ...prev,
              notifications: {
                email: Boolean(notificationPrefs.email),
                push: Boolean(notificationPrefs.push),
                sms: Boolean(notificationPrefs.sms),
              }
            }));
          }

          if (privacyPrefs && typeof privacyPrefs === 'object') {
            setSettings(prev => ({
              ...prev,
              privacy: {
                profileVisibility: String(privacyPrefs.profileVisibility || 'public'),
                showLocation: Boolean(privacyPrefs.showLocation),
                showAvailability: Boolean(privacyPrefs.showAvailability),
              }
            }));
          }
        } catch (error) {
          console.error('Error parsing settings:', error);
          setSettings(defaultSettings);
        }
      }
    };

    fetchSettings();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <div className="grid gap-6">
        <VerificationRequest />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <Switch
                id="email-notifications"
                checked={settings.notifications.email}
                onCheckedChange={(checked) =>
                  updateSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <Switch
                id="push-notifications"
                checked={settings.notifications.push}
                onCheckedChange={(checked) =>
                  updateSettings({
                    ...settings,
                    notifications: { ...settings.notifications, push: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-notifications">SMS Notifications</Label>
              <Switch
                id="sms-notifications"
                checked={settings.notifications.sms}
                onCheckedChange={(checked) =>
                  updateSettings({
                    ...settings,
                    notifications: { ...settings.notifications, sms: checked },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Privacy Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="profile-visibility">Show Profile Publicly</Label>
              <Switch
                id="profile-visibility"
                checked={settings.privacy.profileVisibility === "public"}
                onCheckedChange={(checked) =>
                  updateSettings({
                    ...settings,
                    privacy: {
                      ...settings.privacy,
                      profileVisibility: checked ? "public" : "private",
                    },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="location-sharing">Share Location</Label>
              <Switch
                id="location-sharing"
                checked={settings.privacy.showLocation}
                onCheckedChange={(checked) =>
                  updateSettings({
                    ...settings,
                    privacy: { ...settings.privacy, showLocation: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="availability-sharing">Show Availability</Label>
              <Switch
                id="availability-sharing"
                checked={settings.privacy.showAvailability}
                onCheckedChange={(checked) =>
                  updateSettings({
                    ...settings,
                    privacy: { ...settings.privacy, showAvailability: checked },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;