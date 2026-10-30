import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, servers, appLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseServerConfig } from "@/lib/utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const subId = parseInt(id);

  try {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subId));
    if (!sub) return NextResponse.json({ error: "الاشتراك غير موجود" }, { status: 404 });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(sub.url, {
      signal: controller.signal,
      headers: { "User-Agent": "2n5a/1.0" },
    });
    clearTimeout(timeout);
    const text = await response.text();
    let content = text;
    try {
      const decoded = Buffer.from(text.trim(), "base64").toString("utf-8");
      if (decoded.includes("://")) content = decoded;
    } catch {}

    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    const parsedServers: (typeof servers.$inferInsert)[] = [];
    for (const line of lines) {
      const parsed = parseServerConfig(line.trim());
      if (parsed) {
        parsedServers.push({
          name: parsed.name || sub.name,
          protocol: parsed.protocol,
          address: parsed.address,
          port: parsed.port,
          rawConfig: parsed.rawConfig,
          subscriptionId: subId,
        });
      }
    }

    if (parsedServers.length > 0) {
      await db.delete(servers).where(eq(servers.subscriptionId, subId));
      await db.insert(servers).values(parsedServers);
    }

    await db.update(subscriptions).set({
      lastUpdated: new Date(),
      serverCount: parsedServers.length,
    }).where(eq(subscriptions.id, subId));

    await db.insert(appLogs).values({
      level: "info",
      category: "subscriptions",
      message: `تم تحديث: ${sub.name} - ${parsedServers.length} سيرفر`,
    });

    const [updated] = await db.select().from(subscriptions).where(eq(subscriptions.id, subId));
    return NextResponse.json({ subscription: updated, message: `تم جلب ${parsedServers.length} سيرفر` });
  } catch (err) {
    await db.insert(appLogs).values({
      level: "error",
      category: "subscriptions",
      message: "فشل تحديث الاشتراك",
      details: { error: String(err) },
    });
    return NextResponse.json({ error: "فشل في تحديث الاشتراك" }, { status: 500 });
  }
}
