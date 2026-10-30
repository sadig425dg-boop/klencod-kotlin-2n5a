"use client";
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/utils";
import {
  Plus,
  RefreshCw,
  Trash2,
  BookOpen,
  Clock,
  Server,
  X,
  CheckCircle,
  AlertCircle,
  Globe,
} from "lucide-react";

interface Subscription {
  id: number;
  name: string;
  url: string;
  isActive: boolean;
  autoUpdate: boolean;
  lastUpdated: string | null;
  serverCount: number;
  updateIntervalHours: number;
}

export function SubscriptionsScreen() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // نموذج الإضافة
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const notify = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await fetch("/api/subscriptions");
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleAdd = async () => {
    if (!newName.trim() || !newUrl.trim()) {
      notify("الاسم والرابط مطلوبان", "error");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, url: newUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify(`تم إضافة الاشتراك - ${data.subscription?.serverCount || 0} سيرفر`);
      setNewName("");
      setNewUrl("");
      setShowAdd(false);
      fetchSubscriptions();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "فشل في إضافة الاشتراك", "error");
    }
    setAdding(false);
  };

  const handleRefresh = async (sub: Subscription) => {
    setRefreshingId(sub.id);
    try {
      const res = await fetch(`/api/subscriptions/${sub.id}/refresh`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify(data.message || "تم التحديث بنجاح");
      fetchSubscriptions();
    } catch {
      notify("فشل في تحديث الاشتراك", "error");
    }
    setRefreshingId(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
      notify("تم حذف الاشتراك وسيرفراته");
      fetchSubscriptions();
    } catch {
      notify("فشل في حذف الاشتراك", "error");
    }
  };

  const formatLastUpdated = (dateStr: string | null) => {
    if (!dateStr) return "لم يتم التحديث بعد";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "للتو";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${Math.floor(diffHours / 24)} يوم`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0E12]">
      {/* الرأس */}
      <div className="sticky top-0 z-20 bg-[#0D0E12]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">الاشتراكات</h1>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowAdd(true)}
            className="rounded-xl"
          >
            <Plus className="w-4 h-4" />
            إضافة
          </Button>
        </div>
      </div>

      {/* الإشعار */}
      {notification && (
        <div
          className={`mx-4 mt-2 border rounded-xl px-4 py-2.5 text-center ${
            notification.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          <span className="text-sm">{notification.msg}</span>
        </div>
      )}

      {/* القائمة */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-32">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <BookOpen className="w-12 h-12 text-white/10" />
            <p className="text-white/30 text-sm">لا توجد اشتراكات</p>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" />
              أضف اشتراكاً
            </Button>
          </div>
        ) : (
          subscriptions.map((sub) => (
            <Card key={sub.id}>
              <div className="flex items-start gap-3">
                {/* الأيقونة */}
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-purple-400" />
                </div>

                {/* المعلومات */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium text-sm">{sub.name}</span>
                    <Badge variant={sub.isActive ? "success" : "default"}>
                      {sub.isActive ? "نشط" : "متوقف"}
                    </Badge>
                  </div>
                  <p className="text-white/40 text-xs truncate mb-2">{sub.url}</p>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <div className="flex items-center gap-1">
                      <Server className="w-3 h-3" />
                      <span>{sub.serverCount} سيرفر</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatLastUpdated(sub.lastUpdated)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                <Button
                  size="sm"
                  variant="secondary"
                  loading={refreshingId === sub.id}
                  onClick={() => handleRefresh(sub)}
                  className="flex-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  تحديث
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(sub.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* مودال الإضافة */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#13141a] border border-white/10 rounded-t-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">إضافة اشتراك</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            <Input
              label="اسم الاشتراك"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="مثال: ثمانية - السيرفرات السريعة"
            />
            <Input
              label="رابط الاشتراك"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/subscription"
              type="url"
            />

            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setShowAdd(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                variant="primary"
                size="md"
                loading={adding}
                onClick={handleAdd}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4" />
                إضافة
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
