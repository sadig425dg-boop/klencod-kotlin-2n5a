import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appSettings, connectionHistory, appLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const settings = await db.select().from(appSettings);
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value || "";
    }

    return NextResponse.json({
      status: settingsMap["vpn_status"] || "disconnected",
      serverId: settingsMap["vpn_server_id"] || null,
      serverName: settingsMap["vpn_server_name"] || null,
      connectedAt: settingsMap["vpn_connected_at"] || null,
      xrayStatus: settingsMap["xray_status"] || "stopped",
      hotspotStatus: settingsMap["hotspot_status"] || "inactive",
      shizukuStatus: settingsMap["shizuku_status"] || "unknown",
    });
  } catch {
    return NextResponse.json({ error: "فشل في جلب حالة VPN" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serverId, serverName } = body;

    if (action === "connect") {
      if (!serverId) {
        return NextResponse.json({ error: "يرجى اختيار سيرفر" }, { status: 400 });
      }

      // تحديث حالة VPN
      await upsertSetting("vpn_status", "connecting");
      await upsertSetting("vpn_server_id", String(serverId));
      await upsertSetting("vpn_server_name", serverName || "");
      await upsertSetting("vpn_connected_at", new Date().toISOString());
      await upsertSetting("xray_status", "starting");

      await db.insert(appLogs).values({
        level: "info",
        category: "vpn",
        message: `جارٍ الاتصال بـ: ${serverName}`,
        details: { serverId, serverName },
      });

      // محاكاة نجاح الاتصال (في التطبيق الحقيقي يتم عبر Xray/VPN Service)
      await new Promise((r) => setTimeout(r, 1000));
      await upsertSetting("vpn_status", "connected");
      await upsertSetting("xray_status", "running");

      // تسجيل بداية الاتصال في السجل
      await db.insert(connectionHistory).values({
        serverId,
        serverName,
        protocol: "vless",
        connectedAt: new Date(),
        success: true,
      });

      await db.insert(appLogs).values({
        level: "info",
        category: "vpn",
        message: `تم الاتصال بنجاح: ${serverName}`,
        details: { serverId, serverName },
      });

      return NextResponse.json({
        status: "connected",
        message: `تم الاتصال بـ ${serverName}`,
      });
    }

    if (action === "disconnect") {
      const connectedAt = (await getSettingValue("vpn_connected_at")) || "";
      const duration = connectedAt
        ? Math.floor((Date.now() - new Date(connectedAt).getTime()) / 1000)
        : 0;

      await upsertSetting("vpn_status", "disconnected");
      await upsertSetting("xray_status", "stopped");
      await upsertSetting("hotspot_status", "inactive");
      await upsertSetting("vpn_server_id", "");
      await upsertSetting("vpn_server_name", "");

      // تحديث آخر سجل اتصال
      await db.insert(appLogs).values({
        level: "info",
        category: "vpn",
        message: `تم قطع الاتصال - المدة: ${duration}ث`,
        details: { duration },
      });

      return NextResponse.json({
        status: "disconnected",
        message: "تم قطع الاتصال",
      });
    }

    if (action === "toggle_hotspot") {
      const currentHotspot = await getSettingValue("hotspot_status");
      const newStatus = currentHotspot === "active" ? "inactive" : "active";
      await upsertSetting("hotspot_status", newStatus);

      await db.insert(appLogs).values({
        level: "info",
        category: "hotspot",
        message: newStatus === "active" ? "تم تفعيل مشاركة الشبكة" : "تم إيقاف مشاركة الشبكة",
      });

      return NextResponse.json({
        hotspotStatus: newStatus,
        message: newStatus === "active" ? "تم تفعيل مشاركة نقطة الاتصال عبر Shizzi" : "تم إيقاف مشاركة الشبكة",
      });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (err) {
    await db.insert(appLogs).values({
      level: "error",
      category: "vpn",
      message: "خطأ في عملية VPN",
      details: { error: String(err) },
    });
    return NextResponse.json({ error: "فشل في تنفيذ العملية" }, { status: 500 });
  }
}

async function upsertSetting(key: string, value: string) {
  const existing = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key));

  if (existing.length > 0) {
    await db
      .update(appSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(appSettings.key, key));
  } else {
    await db.insert(appSettings).values({ key, value });
  }
}

async function getSettingValue(key: string): Promise<string | null> {
  const [setting] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key));
  return setting?.value || null;
}
