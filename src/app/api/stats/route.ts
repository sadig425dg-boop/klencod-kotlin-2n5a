import { NextResponse } from "next/server";
import { db } from "@/db";
import { connectionHistory, appSettings } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const settings = await db.select().from(appSettings);
    const settingsMap: Record<string, string> = {};
    for (const s of settings) settingsMap[s.key] = s.value || "";

    const recentHistory = await db
      .select()
      .from(connectionHistory)
      .orderBy(desc(connectionHistory.connectedAt))
      .limit(10);

    const serverCountResult = await db.execute(
      sql`SELECT COUNT(*)::int as count FROM servers`
    );
    const subCountResult = await db.execute(
      sql`SELECT COUNT(*)::int as count FROM subscriptions`
    );
    const totalsResult = await db.execute(
      sql`SELECT 
        COALESCE(SUM(download_bytes), 0)::bigint as total_download,
        COALESCE(SUM(upload_bytes), 0)::bigint as total_upload,
        COUNT(*)::int as total_sessions
       FROM connection_history`
    );

    const serverCount = (serverCountResult.rows[0] as { count: number }).count || 0;
    const subCount = (subCountResult.rows[0] as { count: number }).count || 0;
    const totals = totalsResult.rows[0] as {
      total_download: string;
      total_upload: string;
      total_sessions: number;
    };

    const isConnected = settingsMap["vpn_status"] === "connected";
    const connectedAt = settingsMap["vpn_connected_at"] || null;
    const durationSeconds =
      connectedAt && isConnected
        ? Math.floor((Date.now() - new Date(connectedAt).getTime()) / 1000)
        : 0;

    const downloadSpeed = isConnected
      ? Math.floor(Math.random() * 2000000 + 500000)
      : 0;
    const uploadSpeed = isConnected
      ? Math.floor(Math.random() * 500000 + 100000)
      : 0;

    return NextResponse.json({
      serverCount,
      subscriptionCount: subCount,
      vpnStatus: settingsMap["vpn_status"] || "disconnected",
      xrayStatus: settingsMap["xray_status"] || "stopped",
      hotspotStatus: settingsMap["hotspot_status"] || "inactive",
      shizukuStatus: settingsMap["shizuku_status"] || "unknown",
      currentServer: settingsMap["vpn_server_name"] || null,
      connectedAt,
      durationSeconds,
      downloadSpeed,
      uploadSpeed,
      totalDownload: parseInt(totals?.total_download || "0"),
      totalUpload: parseInt(totals?.total_upload || "0"),
      totalSessions: totals?.total_sessions || 0,
      recentHistory,
    });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({ error: "فشل في جلب الإحصائيات" }, { status: 500 });
  }
}
