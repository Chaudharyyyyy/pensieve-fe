import { cn } from "@/lib/utils";

interface StrengthBarProps {
  segments?: number;
  level: number;
}

export const StrengthBar = ({ segments = 4, level }: StrengthBarProps) => (
  <div className="flex gap-1 mt-2">
    {Array.from({ length: segments }, (_, i) => (
      <div
        key={i}
        className={cn(
          "h-1 flex-1 rounded-full transition-colors duration-300",
          i < level
            ? level <= 1 ? "bg-pen-600" : level <= 2 ? "bg-pen-400" : "bg-pen-accent"
            : "bg-pen-800"
        )}
      />
    ))}
  </div>
);
