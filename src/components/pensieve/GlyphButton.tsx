import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlyphButtonProps {
  variant?: "primary" | "ghost" | "text";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

export const GlyphButton = ({
  variant = "primary",
  children,
  onClick,
  disabled,
  className,
  type = "button",
}: GlyphButtonProps) => {
  const base = "relative font-ui text-sm tracking-wide transition-all duration-300 active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed";

  const variants = {
    primary: cn(
      base,
      "clip-corner bg-pen-accent text-pen-black px-8 py-3 overflow-hidden",
      "hover:bg-pen-200"
    ),
    ghost: cn(
      base,
      "border border-pen-600 text-pen-300 px-8 py-3",
      "hover:border-pen-400 hover:text-pen-white hover:shadow-[0_0_15px_hsl(var(--pen-600)/0.3)]"
    ),
    text: cn(
      base,
      "font-mono text-xs text-pen-400 underline underline-offset-4 decoration-pen-600",
      "hover:text-pen-300 hover:decoration-pen-400"
    ),
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(variants[variant], className)}
    >
      {children}
    </motion.button>
  );
};
