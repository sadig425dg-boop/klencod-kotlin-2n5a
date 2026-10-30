import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { servers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { appLogs } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const { serverId, address, port } = await request.json();

    // محاكاة اختبار Ping - في التطبيق الحقيقي يتم عبر TCP Connect
    const start = Date.now();

    let pingMs: number;
    let success = false;

    try {
      // نحاول الاتصال بالسيرفر عبر fetch timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        await fetch(`https://${address}:${port}`, {
          signal: controller.signal,
          method: "HEAD",
        });
        clearTimeout(timeout);
        success = true;
      } catch {
        clearTimeout(timeout);
        // نتحقق من الوقت المستغرق
        const elapsed = Date.now() - start;
        if (elapsed < 5000) {
          // Connection refused - means server exists but refused
          pingMs = elapsed;
          success = true;
        } else {
          pingMs = 9999;
          success = false;
        }
      }

      pingMs = success ? Date.now() - start : 9999;
    } catch {
      pingMs = 9999;
      success = false;
    }

    // نحدث قيمة Ping في قاعدة البيانات
    if (serverId) {
      await db
        .update(servers)
        .set({ pingMs: pingMs < 9999 ? pingMs : null })
        .where(eq(servers.id, serverId));
    }

    // نسجل العملية
    await db.insert(appLogs).values({
      level: "info",
      category: "network",
      message: `Ping test: ${address}:${port} - ${pingMs}ms`,
      details: { serverId, address, port, pingMs, success },
    });

    return NextResponse.json({ pingMs, success });
  } catch (error) {
    return NextResponse.json({ error: "فشل في اختبار Ping", pingMs: 9999, success: false }, { status: 500 });
  }
}
