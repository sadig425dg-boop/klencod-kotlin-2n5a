"use client";
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, TextArea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getProtocolColor, getPingColor } from "@/lib/utils";
import {
  Plus,
  Search,
  Star,
  Trash2,
  Wifi,
  Copy,
  RefreshCw,
  ChevronRight,
  X,
  ClipboardPaste,
  Filter,
  ArrowRight,
} from "lucide-react";

interface Server {
  id: number;
  name: string;
  protocol: string;
  address: string;
  port: number;
  isFavorite: boolean;
  pingMs: number | null;
  lastUsed: string | null;
  security?: string;
  network?: string;
  rawConfig?: string;
  subscriptionId?: number | null;
}

export function ServersScreen() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [pinging, setPinging] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [filterProtocol, setFilterProtocol] = useState("all");

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchServers = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setServers(data.servers || []);
    } catch {}
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const handleImport = async () => {
    if (!importText.trim()) return;
    setImporting(true);
    try {
      const lines = importText.split(/\r?\n/).filter((l) => l.trim());
      let added = 0;
      for (const line of lines) {
        if (line.match(/^(vless|vmess|trojan|ss):\/\//)) {
          const res = await fetch("/api/servers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rawConfig: line.trim() }),
          });
          if (res.ok) added++;
        }
      }
      notify(`تم إضافة ${added} سيرفر بنجاح`);
      setImportText("");
      setShowImport(false);
      fetchServers();
    } catch {
      notify("فشل في استيراد السيرفرات");
    }
    setImporting(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/servers/${id}`, { method: "DELETE" });
      setServers((prev) => prev.filter((s) => s.id !== id));
      notify("تم حذف السيرفر");
      if (selectedServer?.id === id) setSelectedServer(null);
    } catch {
      notify("فشل في حذف السيرفر");
    }
  };

  const handleFavorite = async (server: Server) => {
    try {
      await fetch(`/api/servers/${server.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !server.isFavorite }),
      });
      fetchServers();
    } catch {}
  };

  const handlePing = async (server: Server) => {
    setPinging(server.id);
    try {
      const res = await fetch("/api/servers/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverId: server.id,
          address: server.address,
          port: server.port,
        }),
      });
      const data = await res.json();
      notify(
        data.success
          ? `Ping: ${data.pingMs}ms`
          : "انتهت مهلة Ping"
      );
      fetchServers();
    } catch {
      notify("فشل اختبار Ping");
    }
    setPinging(null);
  };

  const handleCopy = (server: Server) => {
    if (server.rawConfig) {
      navigator.clipboard.writeText(server.rawConfig).then(() => notify("تم نسخ الإعداد"));
    }
  };

  const handleConnect = async (server: Server) => {
    try {
      const res = await fetch("/api/vpn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect",
          serverId: server.id,
          serverName: server.name,
        }),
      });
      const data = await res.json();
      notify(data.message || "جارٍ الاتصال...");
    } catch {
      notify("فشل الاتصال");
    }
  };

  const protocols = ["all", "vless", "vmess", "trojan", "ss"];
  const filteredServers =
    filterProtocol === "all"
      ? servers
      : servers.filter((s) => s.protocol === filterProtocol);

  return (
    <div className="flex flex-col h-full bg-[#0D0E12]">
      {/* الرأس */}
      <div className="sticky top-0 z-20 bg-[#0D0E12]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-white">السيرفرات</h1>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm">{filteredServers.length} سيرفر</span>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowImport(true)}
              className="rounded-xl"
            >
              <Plus className="w-4 h-4" />
              استيراد
            </Button>
          </div>
        </div>

        {/* بحث */}
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث عن سيرفر..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* فلتر البروتوكول */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {protocols.map((p) => (
            <button
              key={p}
              onClick={() => setFilterProtocol(p)}
              className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterProtocol === p
                  ? "bg-purple-500/30 text-purple-300 border border-purple-500/40"
                  : "bg-white/5 text-white/50 border border-white/10"
              }`}
            >
              {p === "all" ? "الكل" : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* الإشعار */}
      {notification && (
        <div className="mx-4 mt-2 bg-purple-500/20 border border-purple-500/30 rounded-xl px-4 py-2.5 text-center">
          <span className="text-purple-300 text-sm">{notification}</span>
        </div>
      )}

      {/* قائمة السيرفرات */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-32">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        ) : filteredServers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Wifi className="w-12 h-12 text-white/10" />
            <p className="text-white/30 text-sm">لا توجد سيرفرات</p>
            <Button size="sm" variant="ghost" onClick={() => setShowImport(true)}>
              <Plus className="w-4 h-4" />
              أضف سيرفراً
            </Button>
          </div>
        ) : (
          filteredServers.map((server) => (
            <div key={server.id}>
              <Card
                onClick={() =>
                  setSelectedServer(selectedServer?.id === server.id ? null : server)
                }
                className={`transition-all ${
                  selectedServer?.id === server.id ? "border-purple-500/40" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* البروتوكول */}
                  <span
                    className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold ${getProtocolColor(server.protocol)}`}
                  >
                    {server.protocol.toUpperCase()}
                  </span>

                  {/* المعلومات */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{server.name}</p>
                    <p className="text-white/40 text-xs truncate">
                      {server.address}:{server.port}
                    </p>
                  </div>

                  {/* Ping */}
                  {server.pingMs && (
                    <span
                      className={`text-xs font-medium flex-shrink-0 ${getPingColor(server.pingMs)}`}
                    >
                      {server.pingMs} ms
                    </span>
                  )}

                  {/* المفضلة */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavorite(server);
                    }}
                    className="flex-shrink-0"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        server.isFavorite
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-white/20"
                      }`}
                    />
                  </button>

                  <ChevronRight
                    className={`w-4 h-4 text-white/20 transition-transform ${
                      selectedServer?.id === server.id ? "rotate-90" : ""
                    }`}
                  />
                </div>

                {/* تفاصيل الاتصال عند التوسع */}
                {selectedServer?.id === server.id && (
                  <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {server.security && (
                        <div className="flex gap-1">
                          <span className="text-white/40">الأمان:</span>
                          <span className="text-white/70">{server.security}</span>
                        </div>
                      )}
                      {server.network && (
                        <div className="flex gap-1">
                          <span className="text-white/40">الشبكة:</span>
                          <span className="text-white/70">{server.network}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleConnect(server)}
                        className="flex-1"
                      >
                        <Wifi className="w-3.5 h-3.5" />
                        اتصال
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={pinging === server.id}
                        onClick={() => handlePing(server)}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(server)}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(server.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ))
        )}
      </div>

      {/* مودال الاستيراد */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#13141a] border border-white/10 rounded-t-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">استيراد السيرفرات</h2>
              <button
                onClick={() => setShowImport(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            <p className="text-white/50 text-sm">
              الصق كود اتصال V2Ray (VLESS / VMess / Trojan / SS) - سطر واحد أو أكثر
            </p>

            <TextArea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="vless://9a8b7c6d-1122..."
              rows={5}
              className="font-mono text-xs"
            />

            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  navigator.clipboard.readText().then((text) => setImportText(text));
                }}
                className="flex-1"
              >
                <ClipboardPaste className="w-4 h-4" />
                لصق
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={importing}
                onClick={handleImport}
                className="flex-1"
              >
                <ArrowRight className="w-4 h-4" />
                حفظ الكود
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
