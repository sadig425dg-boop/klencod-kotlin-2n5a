import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}ث`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}د ${seconds % 60}ث`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}س ${m}د`;
}

export function formatSpeed(bytesPerSecond: number): string {
  return formatBytes(bytesPerSecond) + "/ث";
}

export function parseVlessConfig(uri: string) {
  try {
    const url = new URL(uri);
    if (url.protocol !== "vless:") return null;
    const params = url.searchParams;
    return {
      protocol: "vless",
      uuid: url.username,
      address: url.hostname,
      port: parseInt(url.port) || 443,
      name: decodeURIComponent(url.hash.slice(1)) || "VLESS Server",
      security: params.get("security") || "none",
      network: params.get("type") || "tcp",
      sni: params.get("sni") || "",
      fingerprint: params.get("fp") || "",
      flow: params.get("flow") || "",
      publicKey: params.get("pbk") || "",
      shortId: params.get("sid") || "",
      host: params.get("host") || "",
      path: params.get("path") || "",
      serviceName: params.get("serviceName") || "",
      rawConfig: uri,
    };
  } catch {
    return null;
  }
}

export function parseVmessConfig(uri: string) {
  try {
    if (!uri.startsWith("vmess://")) return null;
    const b64 = uri.slice(8);
    const decoded = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
    const config = JSON.parse(decoded);
    return {
      protocol: "vmess",
      uuid: config.id,
      address: config.add,
      port: parseInt(config.port) || 443,
      name: config.ps || "VMess Server",
      security: config.tls || "none",
      network: config.net || "tcp",
      sni: config.sni || config.host || "",
      host: config.host || "",
      path: config.path || "",
      encryption: config.scy || "auto",
      rawConfig: uri,
    };
  } catch {
    return null;
  }
}

export function parseTrojanConfig(uri: string) {
  try {
    const url = new URL(uri);
    if (url.protocol !== "trojan:") return null;
    const params = url.searchParams;
    return {
      protocol: "trojan",
      password: url.username,
      address: url.hostname,
      port: parseInt(url.port) || 443,
      name: decodeURIComponent(url.hash.slice(1)) || "Trojan Server",
      security: params.get("security") || "tls",
      network: params.get("type") || "tcp",
      sni: params.get("sni") || "",
      host: params.get("host") || "",
      path: params.get("path") || "",
      rawConfig: uri,
    };
  } catch {
    return null;
  }
}

export function parseShadowsocksConfig(uri: string) {
  try {
    if (!uri.startsWith("ss://")) return null;
    const withoutScheme = uri.slice(5);
    const hashIndex = withoutScheme.indexOf("#");
    const name = hashIndex !== -1
      ? decodeURIComponent(withoutScheme.slice(hashIndex + 1))
      : "Shadowsocks";
    const main = hashIndex !== -1 ? withoutScheme.slice(0, hashIndex) : withoutScheme;
    const atIndex = main.lastIndexOf("@");
    const serverPart = main.slice(atIndex + 1);
    const colonIndex = serverPart.lastIndexOf(":");
    const address = serverPart.slice(0, colonIndex);
    const port = parseInt(serverPart.slice(colonIndex + 1));
    const methodPwd = atob(main.slice(0, atIndex));
    const [method, password] = methodPwd.split(":");
    return {
      protocol: "ss",
      method,
      password,
      address,
      port,
      name,
      rawConfig: uri,
    };
  } catch {
    return null;
  }
}

export function parseServerConfig(uri: string) {
  const trimmed = uri.trim();
  if (trimmed.startsWith("vless://")) return parseVlessConfig(trimmed);
  if (trimmed.startsWith("vmess://")) return parseVmessConfig(trimmed);
  if (trimmed.startsWith("trojan://")) return parseTrojanConfig(trimmed);
  if (trimmed.startsWith("ss://")) return parseShadowsocksConfig(trimmed);
  return null;
}

export function getProtocolColor(protocol: string): string {
  switch (protocol?.toLowerCase()) {
    case "vless": return "text-purple-400 bg-purple-400/20";
    case "vmess": return "text-blue-400 bg-blue-400/20";
    case "trojan": return "text-orange-400 bg-orange-400/20";
    case "ss": return "text-green-400 bg-green-400/20";
    default: return "text-gray-400 bg-gray-400/20";
  }
}

export function getPingColor(ms: number): string {
  if (ms < 100) return "text-green-400";
  if (ms < 200) return "text-yellow-400";
  if (ms < 500) return "text-orange-400";
  return "text-red-400";
}
