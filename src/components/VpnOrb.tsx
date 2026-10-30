"use client";
import { cn } from "@/lib/utils";

type VpnStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

interface VpnOrbProps {
  status: VpnStatus;
  size?: "sm" | "md" | "lg";
}

export function VpnOrb({ status, size = "lg" }: VpnOrbProps) {
  const sizes = {
    sm: { outer: "w-32 h-32", ring1: "w-28 h-28", ring2: "w-20 h-20", ring3: "w-12 h-12", center: "w-6 h-6" },
    md: { outer: "w-48 h-48", ring1: "w-40 h-40", ring2: "w-28 h-28", ring3: "w-16 h-16", center: "w-8 h-8" },
    lg: { outer: "w-64 h-64", ring1: "w-56 h-56", ring2: "w-40 h-40", ring3: "w-24 h-24", center: "w-12 h-12" },
  };

  const s = sizes[size];

  const colors = {
    disconnected: {
      ring: "border-gray-600",
      innerRing: "border-gray-700",
      center: "bg-gray-600",
      glow: "",
      pulse: false,
    },
    connecting: {
      ring: "border-purple-500",
      innerRing: "border-purple-600",
      center: "bg-purple-500",
      glow: "shadow-purple-500/40",
      pulse: true,
    },
    connected: {
      ring: "border-purple-500",
      innerRing: "border-pink-500",
      center: "bg-pink-500",
      glow: "shadow-pink-500/50",
      pulse: false,
    },
    reconnecting: {
      ring: "border-yellow-500",
      innerRing: "border-yellow-600",
      center: "bg-yellow-500",
      glow: "shadow-yellow-500/40",
      pulse: true,
    },
    error: {
      ring: "border-red-500",
      innerRing: "border-red-600",
      center: "bg-red-500",
      glow: "shadow-red-500/40",
      pulse: false,
    },
  };

  const c = colors[status] || colors.disconnected;

  return (
    <div className={cn("relative flex items-center justify-center", s.outer)}>
      {/* الحلقة الخارجية */}
      <div
        className={cn(
          "absolute rounded-full border-4 border-t-transparent border-b-transparent",
          s.ring1,
          c.ring,
          c.pulse && "animate-spin",
          !c.pulse && status === "connected" && "animate-pulse"
        )}
        style={{ animationDuration: c.pulse ? "2s" : "3s" }}
      />

      {/* الحلقة الوسطى */}
      <div
        className={cn(
          "absolute rounded-full border-4 border-l-transparent border-r-transparent",
          s.ring2,
          c.innerRing,
          status === "connected" && "animate-pulse",
          c.pulse && "animate-spin"
        )}
        style={{
          animationDuration: c.pulse ? "1.5s" : "4s",
          animationDirection: "reverse",
        }}
      />

      {/* الحلقة الداخلية */}
      <div
        className={cn(
          "absolute rounded-full border-4 border-t-transparent border-b-transparent",
          s.ring3,
          c.ring,
          status === "connected" && "animate-pulse"
        )}
        style={{ animationDuration: "5s" }}
      />

      {/* النقطة المركزية */}
      <div
        className={cn(
          "relative rounded-full shadow-2xl transition-all duration-500",
          s.center,
          c.center,
          c.glow && `shadow-xl ${c.glow}`
        )}
      >
        {/* تأثير الإضاءة الداخلية */}
        <div className="absolute inset-0 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

export function VpnStatusText({ status }: { status: VpnStatus }) {
  const texts: Record<VpnStatus, { text: string; color: string }> = {
    disconnected: { text: "غير متصل", color: "text-gray-400" },
    connecting: { text: "جارٍ الاتصال...", color: "text-purple-400" },
    connected: { text: "متصل", color: "text-green-400" },
    reconnecting: { text: "جارٍ إعادة الاتصال...", color: "text-yellow-400" },
    error: { text: "فشل الاتصال", color: "text-red-400" },
  };

  const { text, color } = texts[status] || texts.disconnected;

  return (
    <span className={cn("font-semibold text-lg", color)}>
      {text}
    </span>
  );
}
