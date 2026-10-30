import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { servers } from "@/db/schema";
import { desc, like, or } from "drizzle-orm";
import { parseServerConfig } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    let allServers;
    if (search) {
      allServers = await db
        .select()
        .from(servers)
        .where(
          or(
            like(servers.name, `%${search}%`),
            like(servers.address, `%${search}%`)
          )
        )
        .orderBy(desc(servers.isFavorite), desc(servers.createdAt));
    } else {
      allServers = await db
        .select()
        .from(servers)
        .orderBy(desc(servers.isFavorite), desc(servers.createdAt));
    }

    return NextResponse.json({ servers: allServers });
  } catch (error) {
    console.error("Error fetching servers:", error);
    return NextResponse.json({ error: "فشل في جلب السيرفرات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.rawConfig) {
      const parsed = parseServerConfig(body.rawConfig);
      if (!parsed) {
        return NextResponse.json({ error: "تنسيق الإعداد غير صالح" }, { status: 400 });
      }

      const insertData: typeof servers.$inferInsert = {
        name: parsed.name || "سيرفر جديد",
        protocol: parsed.protocol,
        address: parsed.address,
        port: parsed.port,
        rawConfig: parsed.rawConfig,
      };

      if ("uuid" in parsed) insertData.uuid = parsed.uuid;
      if ("password" in parsed) insertData.password = parsed.password;
      if ("encryption" in parsed) insertData.encryption = parsed.encryption;
      if ("security" in parsed) insertData.security = parsed.security;
      if ("network" in parsed) insertData.network = parsed.network;
      if ("host" in parsed) insertData.host = parsed.host;
      if ("path" in parsed) insertData.path = parsed.path;
      if ("sni" in parsed) insertData.sni = parsed.sni;
      if ("fingerprint" in parsed) insertData.fingerprint = parsed.fingerprint;
      if ("flow" in parsed) insertData.flow = parsed.flow;
      if ("publicKey" in parsed) insertData.publicKey = parsed.publicKey;
      if ("shortId" in parsed) insertData.shortId = parsed.shortId;
      if ("serviceName" in parsed) insertData.serviceName = parsed.serviceName;
      if ("method" in parsed) insertData.method = parsed.method;

      const [server] = await db.insert(servers).values(insertData).returning();
      return NextResponse.json({ server, message: "تم إضافة السيرفر بنجاح" });
    }

    const { name, protocol, address, port } = body;
    if (!name || !protocol || !address || !port) {
      return NextResponse.json({ error: "الحقول المطلوبة غير مكتملة" }, { status: 400 });
    }

    const insertData: typeof servers.$inferInsert = {
      name,
      protocol,
      address,
      port: parseInt(port),
      uuid: body.uuid,
      password: body.password,
      encryption: body.encryption,
      security: body.security,
      network: body.network,
      host: body.host,
      path: body.path,
      sni: body.sni,
      fingerprint: body.fingerprint,
      flow: body.flow,
      publicKey: body.publicKey,
      shortId: body.shortId,
      serviceName: body.serviceName,
      method: body.method,
    };

    const [server] = await db.insert(servers).values(insertData).returning();
    return NextResponse.json({ server, message: "تم إضافة السيرفر بنجاح" });
  } catch (error) {
    console.error("Error creating server:", error);
    return NextResponse.json({ error: "فشل في إضافة السيرفر" }, { status: 500 });
  }
}
