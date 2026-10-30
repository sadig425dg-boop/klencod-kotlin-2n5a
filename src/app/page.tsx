"use client";
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { DashboardScreen } from "@/components/screens/DashboardScreen";
import { ServersScreen } from "@/components/screens/ServersScreen";
import { SubscriptionsScreen } from "@/components/screens/SubscriptionsScreen";
import { StatsScreen } from "@/components/screens/StatsScreen";
import { LogsScreen } from "@/components/screens/LogsScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleSelectServer = () => setActiveTab("servers");
  const handleOpenSettings = () => setActiveTab("settings");

  const renderScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardScreen
            onSelectServer={handleSelectServer}
            onOpenSettings={handleOpenSettings}
          />
        );
      case "servers":
        return <ServersScreen />;
      case "subscriptions":
        return <SubscriptionsScreen />;
      case "stats":
        return <StatsScreen />;
      case "logs":
        return <LogsScreen />;
      case "settings":
        return <SettingsScreen />;
      default:
        return (
          <DashboardScreen
            onSelectServer={handleSelectServer}
            onOpenSettings={handleOpenSettings}
          />
        );
    }
  };

  return (
    <main className="relative h-screen w-full max-w-md mx-auto overflow-hidden bg-[#0D0E12]">
      {/* شاشة التطبيق */}
      <div className="h-full overflow-hidden">
        {renderScreen()}
      </div>

      {/* شريط التنقل */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}
