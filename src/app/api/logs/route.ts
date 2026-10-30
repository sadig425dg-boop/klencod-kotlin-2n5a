import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appLogs } from "@/db/schema";
import { desc, eq, like } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const level = searchParams.get("level") || "";
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "100");

    let query = db.select().from(appLogs);
    const conditions = [];

    if (category && category !== "all") {
      conditions.push(eq(appLogs.category, category));
    }
    if (level && level !== "all") {
      conditions.push(eq(appLogs.level, level));
    }
    if (search) {
      conditions.push(like(appLogs.message, `%${search}%`));
    }

    const logs = await db
      .select()
      .from(appLogs)
      .orderBy(desc(appLogs.createdAt))
      .limit(limit);

    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: "فشل في جلب السجلات" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.delete(appLogs);
    return NextResponse.json({ message: "تم مسح جميع السجلات" });
  } catch {
    return NextResponse.json({ error: "فشل في مسح السجلات" }, { status: 500 });
  }
}
