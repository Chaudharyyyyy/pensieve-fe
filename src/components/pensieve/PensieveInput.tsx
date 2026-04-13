import { cn } from "@/lib/utils";
import { useState } from "react";

interface PensieveInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export const PensieveInput = ({ label, type = "text", value, onChange, className }: PensieveInputProps) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <div className={cn("relative input-sweep", className)}>
      <label
        className={cn(
          "absolute left-0 font-mono text-pen-400 transition-all duration-300 pointer-events-none",
          active ? "text-[9px] -top-4 uppercase tracking-[0.1em]" : "text-sm top-3"
        )}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent border-b border-pen-700 py-3 text-pen-white font-ui text-sm outline-none focus:border-pen-accent transition-colors"
      />
    </div>
  );
};
