import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, servers, appLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseServerConfig } from "@/lib/utils";

export async function GET() {
  try {
    const allSubscriptions = await db.select().from(subscriptions);
    return NextResponse.json({ subscriptions: allSubscriptions });
  } catch {
    return NextResponse.json({ error: "فشل في جلب الاشتراكات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url } = body;

    if (!name || !url) {
      return NextResponse.json({ error: "الاسم والرابط مطلوبان" }, { status: 400 });
    }

    // إنشاء الاشتراك
    const [sub] = await db.insert(subscriptions).values({
      name,
      url,
      autoUpdate: body.autoUpdate ?? true,
      updateIntervalHours: body.updateIntervalHours ?? 24,
    }).returning();

    // محاولة جلب السيرفرات من رابط الاشتراك
    await fetchAndUpdateSubscription(sub.id, url, name);

    const [updatedSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, sub.id));

    return NextResponse.json({
      subscription: updatedSub,
      message: "تم إضافة الاشتراك بنجاح",
    });
  } catch {
    return NextResponse.json({ error: "فشل في إضافة الاشتراك" }, { status: 500 });
  }
}

async function fetchAndUpdateSubscription(subId: number, url: string, name: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "2n5a/1.0" },
    });
    clearTimeout(timeout);

    const text = await response.text();
    let content = text;

    // محاولة فك تشفير Base64
    try {
      const decoded = Buffer.from(text.trim(), "base64").toString("utf-8");
      if (decoded.includes("://")) content = decoded;
    } catch {}

    // تحليل السيرفرات
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    const parsedServers = [];

    for (const line of lines) {
      const parsed = parseServerConfig(line.trim());
      if (parsed) {
        parsedServers.push({
          name: parsed.name || name,
          protocol: parsed.protocol,
          address: parsed.address,
          port: parsed.port,
          rawConfig: parsed.rawConfig,
          subscriptionId: subId,
        } as typeof servers.$inferInsert);
      }
    }

    if (parsedServers.length > 0) {
      // حذف السيرفرات القديمة لهذا الاشتراك
      await db.delete(servers).where(eq(servers.subscriptionId, subId));
      // إدراج السيرفرات الجديدة
      await db.insert(servers).values(parsedServers);
    }

    // تحديث معلومات الاشتراك
    await db
      .update(subscriptions)
      .set({
        lastUpdated: new Date(),
        serverCount: parsedServers.length,
      })
      .where(eq(subscriptions.id, subId));

    await db.insert(appLogs).values({
      level: "info",
      category: "subscriptions",
      message: `تم تحديث الاشتراك: ${name} - ${parsedServers.length} سيرفر`,
    });
  } catch (err) {
    await db
      .update(subscriptions)
      .set({ lastUpdated: new Date() })
      .where(eq(subscriptions.id, subId));

    await db.insert(appLogs).values({
      level: "error",
      category: "subscriptions",
      message: `فشل تحديث الاشتراك: ${name}`,
      details: { error: String(err) },
    });
  }
}
