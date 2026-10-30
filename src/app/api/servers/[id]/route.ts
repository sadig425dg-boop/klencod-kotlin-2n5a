import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { servers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(servers).where(eq(servers.id, parseInt(id)));
    return NextResponse.json({ message: "تم حذف السيرفر بنجاح" });
  } catch {
    return NextResponse.json({ error: "فشل في حذف السيرفر" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const [server] = await db
      .update(servers)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(servers.id, parseInt(id)))
      .returning();
    return NextResponse.json({ server, message: "تم تحديث السيرفر بنجاح" });
  } catch {
    return NextResponse.json({ error: "فشل في تحديث السيرفر" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [server] = await db.select().from(servers).where(eq(servers.id, parseInt(id)));
    if (!server) return NextResponse.json({ error: "السيرفر غير موجود" }, { status: 404 });
    return NextResponse.json({ server });
  } catch {
    return NextResponse.json({ error: "فشل في جلب السيرفر" }, { status: 500 });
  }
}
