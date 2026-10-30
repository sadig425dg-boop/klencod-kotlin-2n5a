"use client";
import { cn } from "@/lib/utils";
import {
  Home,
  Server,
  BookOpen,
  BarChart2,
  FileText,
  Settings,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "الرئيسية", icon: Home },
  { id: "servers", label: "السيرفرات", icon: Server },
  { id: "subscriptions", label: "الاشتراكات", icon: BookOpen },
  { id: "stats", label: "الإحصائيات", icon: BarChart2 },
  { id: "logs", label: "السجلات", icon: FileText },
  { id: "settings", label: "الإعدادات", icon: Settings },
];

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* خلفية شفافة مع Blur */}
      <div className="absolute inset-0 bg-[#0D0E12]/90 backdrop-blur-xl border-t border-white/8" />

      <div className="relative flex items-center justify-around px-2 py-2 safe-area-bottom">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
                "min-w-[56px]",
                isActive
                  ? "text-pink-400"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200",
                  isActive && "bg-gradient-to-br from-pink-500/20 to-purple-500/20"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]")} />
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink-500" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  isActive && "text-pink-400"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
