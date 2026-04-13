import { cn } from "@/lib/utils";
import { useState } from "react";

interface ThemeChipProps {
  label: string;
  description?: string;
  className?: string;
}

export const ThemeChip = ({ label, description, className }: ThemeChipProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <span
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        "inline-flex items-center px-3 py-1 font-mono text-[10px] uppercase tracking-wider",
        "border border-pen-700 text-pen-300 transition-all duration-300 cursor-default",
        "hover:border-pen-500 hover:text-pen-white",
        className
      )}
    >
      {label}
      {expanded && description && (
        <span className="ml-2 normal-case tracking-normal text-pen-400">
          — {description}
        </span>
      )}
    </span>
  );
};
