"use client";
import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatDuration, formatSpeed } from "@/lib/utils";
import {
  Download,
  Upload,
  Clock,
  Activity,
  Zap,
  Globe,
  Wifi,
  BarChart2,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Server,
} from "lucide-react";

interface StatsData {
  vpnStatus: string;
  xrayStatus: string;
  hotspotStatus: string;
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
  recentHistory: Array<{
    id: number;
    serverName: string;
    connectedAt: string;
    durationSeconds: number | null;
    downloadBytes: number | null;
    uploadBytes: number | null;
    success: boolean;
  }>;
}

export function StatsScreen() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0D0E12]">
        <Activity className="w-8 h-8 text-purple-400 animate-pulse" />
      </div>
    );
  }

  const isConnected = stats.vpnStatus === "connected";

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color = "text-white",
    iconColor = "text-purple-400",
    bg = "from-purple-500/10 to-purple-900/10",
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    color?: string;
    iconColor?: string;
    bg?: string;
  }) => (
    <GlassCard className={`bg-gradient-to-br ${bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-white/50 text-xs">{label}</span>
      </div>
      <span className={`text-xl font-bold ${color}`}>{value}</span>
    </GlassCard>
  );

  return (
    <div className="flex flex-col h-full bg-[#0D0E12]">
      {/* الرأس */}
      <div className="sticky top-0 z-20 bg-[#0D0E12]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">الإحصائيات</h1>
          <Badge variant={isConnected ? "success" : "default"}>
            {isConnected ? "متصل" : "غير متصل"}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {/* بطاقة الاتصال الحالي */}
        {isConnected && (
          <GlassCard className="bg-gradient-to-br from-pink-500/10 to-purple-900/10 border-pink-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 font-semibold text-sm">اتصال نشط</span>
              <span className="text-white/50 text-xs mr-auto">{stats.currentServer}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <Download className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <p className="text-white font-bold text-sm">{formatSpeed(stats.downloadSpeed)}</p>
                <p className="text-white/40 text-xs">تنزيل</p>
              </div>
              <div className="text-center">
                <Clock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <p className="text-white font-bold text-sm">{formatDuration(stats.durationSeconds)}</p>
                <p className="text-white/40 text-xs">المدة</p>
              </div>
              <div className="text-center">
                <Upload className="w-4 h-4 text-pink-400 mx-auto mb-1" />
                <p className="text-white font-bold text-sm">{formatSpeed(stats.uploadSpeed)}</p>
                <p className="text-white/40 text-xs">رفع</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={ArrowDownCircle}
            label="إجمالي التنزيل"
            value={formatBytes(stats.totalDownload)}
            iconColor="text-blue-400"
            color="text-blue-300"
            bg="from-blue-500/10 to-blue-900/10"
          />
          <StatCard
            icon={ArrowUpCircle}
            label="إجمالي الرفع"
            value={formatBytes(stats.totalUpload)}
            iconColor="text-pink-400"
            color="text-pink-300"
            bg="from-pink-500/10 to-pink-900/10"
          />
          <StatCard
            icon={Calendar}
            label="جلسات الاتصال"
            value={String(stats.totalSessions)}
            iconColor="text-purple-400"
            color="text-purple-300"
          />
          <StatCard
            icon={Server}
            label="السيرفرات"
            value={String(stats.serverCount)}
            iconColor="text-green-400"
            color="text-green-300"
            bg="from-green-500/10 to-green-900/10"
          />
        </div>

        {/* حالة المكونات */}
        <GlassCard>
          <h3 className="text-white/60 text-xs font-medium mb-3 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" />
            حالة المكونات
          </h3>
          <div className="space-y-2.5">
            {[
              { label: "Xray Core", status: stats.xrayStatus, active: stats.xrayStatus === "running" },
              { label: "VPN Service", status: stats.vpnStatus, active: isConnected },
              { label: "Hotspot", status: stats.hotspotStatus, active: stats.hotspotStatus === "active" },
              { label: "Shizuku", status: (stats as StatsData & { shizukuStatus?: string }).shizukuStatus ?? "unknown", active: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-white/60 text-sm">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.active ? "bg-green-400 animate-pulse" : "bg-white/20"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      item.active ? "text-green-400" : "text-white/30"
                    }`}
                  >
                    {item.active ? "يعمل" : item.status === "unknown" ? "غير محدد" : "متوقف"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* سجل الاتصالات الأخيرة */}
        {stats.recentHistory.length > 0 && (
          <div>
            <h3 className="text-white/60 text-xs font-medium mb-2 px-1">سجل الاتصالات الأخيرة</h3>
            <div className="space-y-2">
              {stats.recentHistory.map((h) => (
                <GlassCard key={h.id} className="py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        h.success ? "bg-green-400" : "bg-red-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm truncate">{h.serverName || "سيرفر غير معروف"}</p>
                      <p className="text-white/30 text-xs">
                        {new Date(h.connectedAt).toLocaleDateString("ar-SA")}
                        {h.durationSeconds ? ` · ${formatDuration(h.durationSeconds)}` : ""}
                      </p>
                    </div>
                    {(h.downloadBytes ?? 0) > 0 && (
                      <span className="text-white/40 text-xs">
                        {formatBytes(h.downloadBytes ?? 0)}
                      </span>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
