import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const settings = await db.select().from(appSettings);
    const settingsMap: Record<string, string> = {};
    for (const s of settings) settingsMap[s.key] = s.value || "";
    return NextResponse.json({ settings: settingsMap });
  } catch {
    return NextResponse.json({ error: "فشل في جلب الإعدادات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: "المفتاح مطلوب" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key));

    if (existing.length > 0) {
      await db
        .update(appSettings)
        .set({ value: String(value), updatedAt: new Date() })
        .where(eq(appSettings.key, key));
    } else {
      await db.insert(appSettings).values({ key, value: String(value) });
    }

    return NextResponse.json({ message: "تم حفظ الإعداد بنجاح" });
  } catch {
    return NextResponse.json({ error: "فشل في حفظ الإعداد" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    for (const [key, value] of Object.entries(settings)) {
      const existing = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, key));

      if (existing.length > 0) {
        await db
          .update(appSettings)
          .set({ value: String(value), updatedAt: new Date() })
          .where(eq(appSettings.key, key));
      } else {
        await db.insert(appSettings).values({ key, value: String(value) });
      }
    }

    return NextResponse.json({ message: "تم حفظ الإعدادات بنجاح" });
  } catch {
    return NextResponse.json({ error: "فشل في حفظ الإعدادات" }, { status: 500 });
  }
}
