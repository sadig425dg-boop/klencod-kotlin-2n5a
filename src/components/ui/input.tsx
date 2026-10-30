"use client";
import { cn } from "@/lib/utils";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  suffix?: React.ReactNode;
  inputPrefix?: React.ReactNode;
}

export function Input({ label, error, suffix, inputPrefix, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm text-white/60 font-medium">{label}</label>
      )}
      <div className="relative flex items-center">
        {inputPrefix && (
          <div className="absolute right-3 text-white/40">{inputPrefix}</div>
        )}
        <input
          className={cn(
            "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5",
            "text-white placeholder:text-white/30 text-sm",
            "focus:outline-none focus:border-purple-500/60 focus:bg-white/8",
            "transition-all duration-200",
            inputPrefix && "pr-10",
            suffix && "pl-10",
            error && "border-red-500/50",
            className
          )}
          {...props}
        />
        {suffix && (
          <div className="absolute left-3 text-white/40">{suffix}</div>
        )}
      </div>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className, ...props }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm text-white/60 font-medium">{label}</label>
      )}
      <textarea
        className={cn(
          "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5",
          "text-white placeholder:text-white/30 text-sm resize-none",
          "focus:outline-none focus:border-purple-500/60 focus:bg-white/8",
          "transition-all duration-200",
          error && "border-red-500/50",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
