import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  bigint,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";

// جدول السيرفرات
export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  protocol: varchar("protocol", { length: 20 }).notNull(), // vless, vmess, trojan, ss
  address: text("address").notNull(),
  port: integer("port").notNull(),
  uuid: text("uuid"),
  password: text("password"),
  encryption: text("encryption"),
  security: text("security"), // tls, reality, none
  network: text("network"), // tcp, ws, grpc
  host: text("host"),
  path: text("path"),
  sni: text("sni"),
  fingerprint: text("fingerprint"),
  flow: text("flow"),
  alpn: text("alpn"),
  publicKey: text("public_key"),
  shortId: text("short_id"),
  serviceName: text("service_name"),
  method: text("method"),
  rawConfig: text("raw_config"),
  isFavorite: boolean("is_favorite").default(false),
  subscriptionId: integer("subscription_id"),
  lastUsed: timestamp("last_used"),
  pingMs: integer("ping_ms"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// جدول الاشتراكات
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  isActive: boolean("is_active").default(true),
  autoUpdate: boolean("auto_update").default(true),
  updateIntervalHours: integer("update_interval_hours").default(24),
  lastUpdated: timestamp("last_updated"),
  serverCount: integer("server_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول سجل الاتصالات
export const connectionHistory = pgTable("connection_history", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id"),
  serverName: text("server_name"),
  protocol: text("protocol"),
  connectedAt: timestamp("connected_at").defaultNow(),
  disconnectedAt: timestamp("disconnected_at"),
  durationSeconds: integer("duration_seconds"),
  downloadBytes: bigint("download_bytes", { mode: "number" }).default(0),
  uploadBytes: bigint("upload_bytes", { mode: "number" }).default(0),
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
});

// جدول إحصائيات حركة البيانات
export const trafficStatistics = pgTable("traffic_statistics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow(),
  downloadBytes: bigint("download_bytes", { mode: "number" }).default(0),
  uploadBytes: bigint("upload_bytes", { mode: "number" }).default(0),
  sessionCount: integer("session_count").default(0),
});

// جدول إعدادات التطبيق
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// جدول السجلات
export const appLogs = pgTable("app_logs", {
  id: serial("id").primaryKey(),
  level: varchar("level", { length: 10 }).notNull(), // info, warn, error, debug
  category: varchar("category", { length: 30 }).notNull(), // vpn, xray, network, shizuku, hotspot
  message: text("message").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});
