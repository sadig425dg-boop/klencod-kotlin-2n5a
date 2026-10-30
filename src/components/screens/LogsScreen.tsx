"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Search,
  Trash2,
  RefreshCw,
  Filter,
  AlertCircle,
  Info,
  AlertTriangle,
  Bug,
} from "lucide-react";

interface Log {
  id: number;
  level: string;
  category: string;
  message: string;
  createdAt: string;
}

const CATEGORIES = ["all", "vpn", "xray", "network", "hotspot", "subscriptions", "importer"];
const LEVELS = ["all", "info", "warn", "error", "debug"];

const LEVEL_ICONS = {
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  debug: Bug,
};

const LEVEL_COLORS: Record<string, string> = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  debug: "text-gray-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  vpn: "VPN",
  xray: "Xray",
  network: "الشبكة",
  hotspot: "Hotspot",
  subscriptions: "الاشتراكات",
  importer: "الاستيراد",
};

export function LogsScreen() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [clearing, setClearing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (level !== "all") params.set("level", level);
      if (search) params.set("search", search);
      params.set("limit", "200");

      const res = await fetch(`/api/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {}
    setLoading(false);
  }, [category, level, search]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleClear = async () => {
    setClearing(true);
    try {
      await fetch("/api/logs", { method: "DELETE" });
      setLogs([]);
      notify("تم مسح جميع السجلات");
    } catch {
      notify("فشل في مسح السجلات");
    }
    setClearing(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0E12]">
      {/* الرأس */}
      <div className="sticky top-0 z-20 bg-[#0D0E12]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-white">السجلات</h1>
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-xs">{logs.length}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchLogs}
              className="rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={clearing}
              onClick={handleClear}
              className="rounded-xl"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* بحث */}
        <div className="relative mb-2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث في السجلات..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* فلتر المستوى */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none mb-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                level === l
                  ? "bg-purple-500/30 text-purple-300 border border-purple-500/40"
                  : "bg-white/5 text-white/40 border border-white/10"
              }`}
            >
              {l === "all" ? "الكل" : l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* فلتر الفئة */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                category === c
                  ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                  : "bg-white/5 text-white/40 border border-white/10"
              }`}
            >
              {c === "all" ? "الكل" : CATEGORY_LABELS[c] || c}
            </button>
          ))}
        </div>
      </div>

      {notification && (
        <div className="mx-4 mt-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2 text-center">
          <span className="text-purple-300 text-sm">{notification}</span>
        </div>
      )}

      {/* قائمة السجلات */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-32">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <FileText className="w-12 h-12 text-white/10" />
            <p className="text-white/30 text-sm">لا توجد سجلات</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {logs.map((log) => {
              const LevelIcon =
                LEVEL_ICONS[log.level as keyof typeof LEVEL_ICONS] || Info;
              const levelColor =
                LEVEL_COLORS[log.level] || "text-gray-400";

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-2 py-2 px-3 rounded-xl bg-white/3 border border-white/5"
                >
                  <LevelIcon
                    className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${levelColor}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white/30 text-[10px]">
                        {formatTime(log.createdAt)}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium bg-white/5 ${levelColor}`}
                      >
                        {CATEGORY_LABELS[log.category] || log.category}
                      </span>
                    </div>
                    <p className="text-white/70 text-xs leading-relaxed break-words">
                      {log.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
