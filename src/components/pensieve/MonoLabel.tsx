import { cn } from "@/lib/utils";

interface MonoLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const MonoLabel = ({ children, className }: MonoLabelProps) => (
  <span className={cn("font-mono text-[10px] uppercase tracking-[0.1em] text-pen-400", className)}>
    {children}
  </span>
);
