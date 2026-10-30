"use client";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, glow, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl bg-white/5 border border-white/10 p-4",
        "backdrop-blur-sm transition-all duration-200",
        glow && "border-purple-500/30 shadow-lg shadow-purple-500/10",
        onClick && "cursor-pointer hover:bg-white/8 hover:border-white/20 active:scale-[0.98]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function GlassCard({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-white/10 p-4",
        "bg-gradient-to-br from-white/8 to-white/3",
        "backdrop-blur-md transition-all duration-200",
        onClick && "cursor-pointer hover:from-white/12 hover:to-white/6 active:scale-[0.98]",
        className
      )}
    >
      {children}
    </div>
  );
}
