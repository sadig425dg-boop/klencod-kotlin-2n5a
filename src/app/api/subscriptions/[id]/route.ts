import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, servers, appLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseServerConfig } from "@/lib/utils";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subId = parseInt(id);
    await db.delete(servers).where(eq(servers.subscriptionId, subId));
    await db.delete(subscriptions).where(eq(subscriptions.id, subId));
    return NextResponse.json({ message: "تم حذف الاشتراك وسيرفراته بنجاح" });
  } catch {
    return NextResponse.json({ error: "فشل في حذف الاشتراك" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const subId = parseInt(id);

  try {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subId));
    if (!sub) return NextResponse.json({ error: "الاشتراك غير موجود" }, { status: 404 });

    const url = new URL(request.url);
    if (url.pathname.endsWith("/refresh")) {
      await refreshSubscription(sub.id, sub.url, sub.name);
      const [updated] = await db.select().from(subscriptions).where(eq(subscriptions.id, subId));
      return NextResponse.json({ subscription: updated, message: "تم تحديث الاشتراك" });
    }

    return NextResponse.json({ error: "عملية غير معروفة" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "فشل في العملية" }, { status: 500 });
  }
}

async function refreshSubscription(subId: number, url: string, name: string) {
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
          name: parsed.name || name,
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
      message: `تم تحديث: ${name} - ${parsedServers.length} سيرفر`,
    });
  } catch (err) {
    await db.insert(appLogs).values({
      level: "error",
      category: "subscriptions",
      message: `فشل تحديث: ${name}`,
      details: { error: String(err) },
    });
    throw err;
  }
}
