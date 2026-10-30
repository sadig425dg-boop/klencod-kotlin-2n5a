"use client";
import { useState, useEffect, useCallback } from "react";
import { VpnOrb, VpnStatusText } from "@/components/VpnOrb";
import { Button } from "@/components/ui/button";
import { Card, GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatSpeed, formatDuration } from "@/lib/utils";
import {
  Wifi,
  WifiOff,
  Download,
  Upload,
  Clock,
  Globe,
  Zap,
  Shield,
  Share2,
  ChevronDown,
  Settings,
  AlertCircle,
} from "lucide-react";

type VpnStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

interface StatsData {
  vpnStatus: string;
  xrayStatus: string;
  hotspotStatus: string;
  shizukuStatus: string;
  currentServer: string | null;
  connectedAt: string | null;
  durationSeconds: number;
  downloadSpeed: number;
  uploadSpeed: number;
  totalDownload: number;
  totalUpload: number;
  serverCount: number;
  subscriptionCount: number;
  totalSessions: number;
}

interface DashboardScreenProps {
  onSelectServer: () => void;
  onOpenSettings: () => void;
}

export function DashboardScreen({ onSelectServer, onOpenSettings }: DashboardScreenProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [serverName, setServerName] = useState<string>("Fast-Node");

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
      if (data.currentServer) setServerName(data.currentServer);
    } catch {}
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleVpnAction = async () => {
    const isConnected = stats?.vpnStatus === "connected";
    setLoading(true);
    try {
      const res = await fetch("/api/vpn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isConnected ? "disconnect" : "connect",
          serverId: 1,
          serverName,
        }),
      });
      const data = await res.json();
      showNotification(data.message || (isConnected ? "تم قطع الاتصال" : "تم الاتصال"));
      await fetchStats();
    } catch {
      showNotification("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  const handleHotspot = async () => {
    try {
      const res = await fetch("/api/vpn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_hotspot" }),
      });
      const data = await res.json();
      showNotification(data.message || "تم تغيير حالة مشاركة الشبكة");
      await fetchStats();
    } catch {
      showNotification("فشل في تغيير حالة مشاركة الشبكة");
    }
  };

  const vpnStatus = (stats?.vpnStatus || "disconnected") as VpnStatus;
  const isConnected = vpnStatus === "connected";
  const hotspotActive = stats?.hotspotStatus === "active";

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0E12] relative overflow-hidden">
      {/* خلفية متدرجة */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-900/20 blur-3xl" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-pink-900/15 blur-2xl" />
      </div>

      {/* الشريط العلوي */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-12 pb-4">
        <button
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
        >
          <Settings className="w-5 h-5 text-white/70" />
        </button>

        {/* إشعار الحالة */}
        {notification ? (
          <div className="flex-1 mx-3">
            <div className="bg-[#1a1b23] border border-white/10 rounded-2xl px-4 py-2.5 text-center">
              <p className="text-white text-sm font-medium leading-snug">{notification}</p>
            </div>
          </div>
        ) : hotspotActive ? (
          <div className="flex-1 mx-3">
            <div className="bg-[#1a1b23] border border-white/10 rounded-2xl px-4 py-2.5 text-center">
              <p className="text-white text-sm font-medium">تم تفعيل مشاركة نقطة الاتصال عبر Shizzi</p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 mx-3" />
        )}

        {/* اسم السيرفر */}
        <button
          onClick={onSelectServer}
          className="flex items-center gap-1.5 bg-[#1a1b23] border border-white/10 rounded-xl px-3 py-2 hover:bg-white/5 transition-all"
        >
          <span className="text-white/80 text-sm font-medium max-w-[80px] truncate">
            {serverName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-white/40" />
        </button>
      </header>

      {/* المنطقة الرئيسية - كرة VPN */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        <div className="mb-4">
          <VpnOrb status={vpnStatus} size="lg" />
        </div>

        {/* حالة الاتصال */}
        <VpnStatusText status={vpnStatus} />

        {/* بيانات الاتصال عند الاتصال */}
        {isConnected && stats && (
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-white/70 text-xs">{formatSpeed(stats.downloadSpeed)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-white/70 text-xs">{formatDuration(stats.durationSeconds)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-white/70 text-xs">{formatSpeed(stats.uploadSpeed)}</span>
            </div>
          </div>
        )}

        {/* بطاقات المعلومات */}
        {isConnected && (
          <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-xs">
            <GlassCard className="py-3 px-3">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-white/40 text-xs">Xray</span>
              </div>
              <span className="text-green-400 text-xs font-medium">
                {stats?.xrayStatus === "running" ? "يعمل" : "متوقف"}
              </span>
            </GlassCard>
            <GlassCard className="py-3 px-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-white/40 text-xs">VPN</span>
              </div>
              <span className="text-green-400 text-xs font-medium">نشط</span>
            </GlassCard>
          </div>
        )}
      </div>

      {/* أزرار التحكم */}
      <div className="relative z-10 px-6 pb-28 space-y-3">
        {/* زر VPN */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onClick={handleVpnAction}
          className="text-lg font-bold py-4 rounded-3xl"
        >
          {isConnected ? "إيقاف VPN" : loading ? "جارٍ الاتصال..." : "تشغيل VPN"}
        </Button>

        {/* زر مشاركة الشبكة */}
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleHotspot}
          className="text-base font-bold py-4 rounded-3xl"
        >
          <Share2 className="w-5 h-5" />
          {hotspotActive ? "إيقاف مشاركة الشبكة" : "تشغيل مشاركة الشبكة"}
        </Button>

        {/* معلومات الإصدار وشريط الحالة */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-white/20 text-xs">V1.0.0</span>
          <div className="flex items-center gap-2">
            {hotspotActive && (
              <Badge variant="success" className="text-[10px]">
                SHARING ACTIVE
              </Badge>
            )}
            {isConnected && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-white/20 text-xs">STATUS</span>
              </div>
            )}
          </div>
          <span className="text-white/20 text-xs">
            {hotspotActive ? "STATUS SHARING ACTIVE" : isConnected ? "STATUS ACTIVE" : "STATUS IDLE"}
          </span>
        </div>
      </div>
    </div>
  );
}
