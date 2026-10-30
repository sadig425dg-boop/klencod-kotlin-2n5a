"use client";
import { useState, useEffect, useCallback } from "react";
import { GlassCard, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Wifi,
  Shield,
  Globe,
  Bell,
  Database,
  Info,
  ChevronRight,
  Moon,
  Zap,
  Server,
  Share2,
  RefreshCw,
  Lock,
  Code,
  Smartphone,
} from "lucide-react";

interface SettingItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  value?: string | boolean;
  onClick?: () => void;
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
  badge?: string;
  badgeVariant?: "success" | "error" | "warning" | "info" | "default";
}

function SettingItem({
  icon: Icon,
  label,
  description,
  value,
  onClick,
  toggle,
  onToggle,
  badge,
  badgeVariant = "default",
}: SettingItemProps) {
  const isBoolean = typeof value === "boolean";

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 py-3 px-0 border-b border-white/5 last:border-0 ${
        onClick ? "cursor-pointer hover:bg-white/3 -mx-4 px-4 transition-colors" : ""
      }`}
    >
      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium">{label}</p>
        {description && (
          <p className="text-white/40 text-xs mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
        {isBoolean && toggle && onToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(!value);
            }}
            className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
              value ? "bg-pink-500" : "bg-white/10"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 ${
                value ? "right-0.5" : "left-0.5"
              }`}
            />
          </button>
        )}
        {!isBoolean && value && (
          <span className="text-white/40 text-xs">{value}</span>
        )}
        {onClick && !toggle && (
          <ChevronRight className="w-4 h-4 text-white/20" />
        )}
      </div>
    </div>
  );
}

export function SettingsScreen() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [showShizukuModal, setShowShizukuModal] = useState(false);
  const [showV2RayModal, setShowV2RayModal] = useState(false);
  const [v2rayCode, setV2rayCode] = useState("");
  const [savingCode, setSavingCode] = useState(false);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data.settings || {});
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSetting = async (key: string, value: string) => {
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      setSettings((prev) => ({ ...prev, [key]: value }));
    } catch {
      notify("فشل في حفظ الإعداد");
    }
  };

  const getBool = (key: string, defaultVal = false) =>
    settings[key] === "true" ? true : settings[key] === "false" ? false : defaultVal;

  const handleSaveV2RayCode = async () => {
    if (!v2rayCode.trim()) return;
    setSavingCode(true);
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawConfig: v2rayCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify("تم حفظ الكود وإضافة السيرفر بنجاح");
      setV2rayCode("");
      setShowV2RayModal(false);
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "فشل في حفظ الكود");
    }
    setSavingCode(false);
  };

  const vpnMode = settings["vpn_mode"] || "v2ray_follow_vpn";
  const vpnModes = [
    { id: "v2ray_follow_vpn", label: "ربط تلقائي مع V2Ray (Follow VPN)" },
    { id: "global", label: "توجيه عام (Global)" },
    { id: "bypass_cn", label: "تجاوز الشبكات المحلية" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0D0E12]">
      {/* الرأس */}
      <div className="sticky top-0 z-20 bg-[#0D0E12]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white">الإعدادات</h1>
      </div>

      {notification && (
        <div className="mx-4 mt-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2.5 text-center">
          <span className="text-purple-300 text-sm">{notification}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {/* قسم كود V2Ray */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-white font-semibold text-sm">كود اتصال V2Ray</h3>
              <p className="text-white/40 text-xs mt-0.5">VLESS / VMess / Trojan / SS</p>
            </div>
            <button
              onClick={() => setShowV2RayModal(true)}
              className="text-pink-400 text-xs font-medium"
            >
              إدراج كود تجريبي
            </button>
          </div>

          <div className="flex gap-2">
            <input
              value={v2rayCode}
              onChange={(e) => setV2rayCode(e.target.value)}
              placeholder="vless://9a8b7c6d-1122..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/80 text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-purple-500/50"
            />
            <Button
              size="sm"
              variant="secondary"
              loading={savingCode}
              onClick={handleSaveV2RayCode}
              className="rounded-xl flex-shrink-0"
            >
              حفظ الكود
            </Button>
          </div>

          {/* سيرفرات سريعة محفوظة */}
          <div className="mt-3">
            <p className="text-white/40 text-xs mb-2">سيرفرات سريعة محفوظة:</p>
            <div className="space-y-2">
              {[
                { name: "DE-Xray-Reality-01 (VLESS)", ping: 42, active: true },
                { name: "NL-VMess-WS-Stream (VMess)", ping: 58, active: false },
              ].map((s) => (
                <div
                  key={s.name}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                    s.active
                      ? "bg-purple-500/15 border-purple-500/40 text-white"
                      : "bg-white/3 border-white/10 text-white/60"
                  }`}
                >
                  <span className="text-sm font-medium">{s.name}</span>
                  <span
                    className={`text-sm font-bold ${
                      s.ping < 100 ? "text-green-400" : "text-yellow-400"
                    }`}
                  >
                    {s.ping} ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* إعدادات Shizzi */}
        <Card>
          <h3 className="text-white font-semibold text-sm mb-3">
            إعدادات Shizzi (بث نقطة الاتصال عبر Shizuku)
          </h3>
          <div className="space-y-3">
            {/* وضع التوجيه */}
            <div className="bg-white/3 rounded-xl border border-white/8 overflow-hidden">
              <p className="text-white/40 text-xs px-3 pt-2.5 pb-1">وضع توجيه VPN في Shizzi</p>
              {vpnModes.map((mode) => (
                <div
                  key={mode.id}
                  onClick={() => saveSetting("vpn_mode", mode.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors ${
                    vpnMode === mode.id ? "text-white" : "text-white/40"
                  }`}
                >
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      vpnMode === mode.id ? "text-pink-400 rotate-90" : "text-white/20"
                    }`}
                  />
                  <span className="text-sm">{mode.label}</span>
                </div>
              ))}
            </div>

            {/* حالة Shizuku */}
            <div className="flex items-center justify-between bg-white/3 rounded-xl border border-white/8 px-3 py-3">
              <div>
                <p className="text-white/60 text-xs">صلاحية Shizuku</p>
                <p className="text-green-400 text-sm font-semibold mt-0.5">
                  متصل ومفعّل (UID 2000)
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => notify("جارٍ فحص Shizuku...")}
                className="rounded-xl"
              >
                فحص
              </Button>
            </div>
          </div>
        </Card>

        {/* المظهر والخط */}
        <Card>
          <h3 className="text-white font-semibold text-sm mb-3">
            المظهر وخط ثمانية (Thmanyah Font Family)
          </h3>
          <div className="space-y-0">
            <SettingItem
              icon={Moon}
              label="Dark Mode (الوردي الداكن)"
              value={getBool("dark_mode", true)}
              toggle
              onToggle={(v) => saveSetting("dark_mode", String(v))}
              badge="نشط"
              badgeVariant="success"
            />
            <SettingItem
              icon={Globe}
              label="اللغة"
              value="العربية"
              onClick={() => notify("اللغة العربية مفعّلة")}
            />
            <SettingItem
              icon={Smartphone}
              label="RTL (يمين لليسار)"
              value={getBool("rtl", true)}
              toggle
              onToggle={(v) => saveSetting("rtl", String(v))}
            />
          </div>
        </Card>

        {/* إعدادات الاتصال */}
        <Card>
          <h3 className="text-white font-semibold text-sm mb-3">إعدادات التطبيق والاتصال</h3>
          <div className="space-y-0">
            <SettingItem
              icon={Zap}
              label="اتصال تلقائي عند التشغيل"
              value={getBool("auto_connect")}
              toggle
              onToggle={(v) => saveSetting("auto_connect", String(v))}
            />
            <SettingItem
              icon={RefreshCw}
              label="إعادة الاتصال التلقائي"
              value={getBool("auto_reconnect", true)}
              toggle
              onToggle={(v) => saveSetting("auto_reconnect", String(v))}
            />
            <SettingItem
              icon={Shield}
              label="Kill Switch"
              description="قطع الإنترنت عند انقطاع VPN"
              value={getBool("kill_switch")}
              toggle
              onToggle={(v) => saveSetting("kill_switch", String(v))}
            />
            <SettingItem
              icon={Globe}
              label="خادم DNS"
              value={settings["dns_server"] || "1.1.1.1"}
              onClick={() => notify("يمكن تغيير خادم DNS من قاعدة البيانات")}
            />
          </div>
        </Card>

        {/* إعدادات Hotspot */}
        <Card>
          <h3 className="text-white font-semibold text-sm mb-3">مشاركة الشبكة (Hotspot)</h3>
          <div className="space-y-0">
            <SettingItem
              icon={Share2}
              label="مشاركة VPN عبر Hotspot"
              value={getBool("hotspot_share_vpn", true)}
              toggle
              onToggle={(v) => saveSetting("hotspot_share_vpn", String(v))}
            />
            <SettingItem
              icon={Wifi}
              label="USB Tethering"
              value={getBool("usb_tethering")}
              toggle
              onToggle={(v) => saveSetting("usb_tethering", String(v))}
            />
          </div>
        </Card>

        {/* البيانات والخصوصية */}
        <Card>
          <h3 className="text-white font-semibold text-sm mb-3">البيانات والخصوصية</h3>
          <div className="space-y-0">
            <SettingItem
              icon={Database}
              label="حفظ سجلات الاتصال"
              value={getBool("save_logs", true)}
              toggle
              onToggle={(v) => saveSetting("save_logs", String(v))}
            />
            <SettingItem
              icon={Lock}
              label="حماية الإعدادات"
              description="تشفير بيانات الاتصال"
              value={getBool("encrypt_config", true)}
              toggle
              onToggle={(v) => saveSetting("encrypt_config", String(v))}
            />
            <SettingItem
              icon={Bell}
              label="الإشعارات"
              value={getBool("notifications", true)}
              toggle
              onToggle={(v) => saveSetting("notifications", String(v))}
            />
          </div>
        </Card>

        {/* معلومات التطبيق */}
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-black text-lg">2</span>
            </div>
            <div>
              <p className="text-white font-bold">2n5a</p>
              <p className="text-white/40 text-xs">الإصدار 1.0.0</p>
            </div>
          </div>
          <div className="space-y-0">
            <SettingItem
              icon={Code}
              label="كود الأندرويد (Kotlin)"
              value="1.0.0"
              onClick={() => notify("النسخة الأندرويد الأصلية: Shizzi-based")}
            />
            <SettingItem
              icon={Info}
              label="حول التطبيق"
              onClick={() => notify("2n5a - تطبيق VPN عربي احترافي مبني على Shizzi + V2Ray/Xray")}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
