import { cn } from "@/lib/utils";

interface StatusDotProps {
  active?: boolean;
  className?: string;
}

export const StatusDot = ({ active = true, className }: StatusDotProps) => (
  <span
    className={cn(
      "inline-block w-2 h-2 rounded-full",
      active
        ? "bg-pen-accent shadow-[0_0_6px_hsl(var(--pen-accent)/0.5)]"
        : "bg-pen-600",
      active && "animate-[glow-pulse_2s_ease-in-out_infinite]",
      className
    )}
  />
);
