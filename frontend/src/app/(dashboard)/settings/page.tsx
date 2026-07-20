"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { User, Bell, Shield, Paintbrush } from "lucide-react";
import * as motion from "motion/react-client";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl space-y-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your dashboard preferences and account settings</p>
      </motion.div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto justify-start gap-1">
          <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-brand-purple/10 data-[state=active]:text-brand-purple">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2 data-[state=active]:bg-brand-purple/10 data-[state=active]:text-brand-purple">
            <Paintbrush className="h-4 w-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-brand-purple/10 data-[state=active]:text-brand-purple">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-brand-purple/10 data-[state=active]:text-brand-purple">
            <Shield className="h-4 w-4" /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Theme Preferences</CardTitle>
              <CardDescription>Customize the appearance of the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border">
                <div className="space-y-1">
                  <div className="font-medium text-sm">Dark Mode</div>
                  <div className="text-xs text-muted-foreground">Enable dark mode for better viewing in low light.</div>
                </div>
                {mounted && (
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Profile Details</CardTitle>
              <CardDescription>Your account is currently in offline mode.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border border-border">
                <p>Authentication is disabled in this environment.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Alert Preferences</CardTitle>
              <CardDescription>Configure how you receive anomaly alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border">
                <div className="space-y-1">
                  <div className="font-medium text-sm">In-App Notifications</div>
                  <div className="text-xs text-muted-foreground">Show alerts in the dashboard bell icon.</div>
                </div>
                <Switch checked={true} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Security Settings</CardTitle>
              <CardDescription>Manage your sessions and data access.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border border-border">
                <p>Security options are managed by your administrator.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
