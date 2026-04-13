import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PensieveCardProps {
  children: React.ReactNode;
  className?: string;
  tilt?: boolean;
}

export const PensieveCard = ({ children, className, tilt = true }: PensieveCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`perspective(1000px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`);
  };

  const handleMouseLeave = () => setTransform("");

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform }}
      className={cn(
        "relative bg-pen-900/90 backdrop-blur-xl border border-pen-800 corner-brackets transition-transform duration-200",
        "hover:-translate-y-1 hover:shadow-2xl hover:shadow-pen-black/50",
        className
      )}
    >
      {/* Top highlight gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pen-600 to-transparent" />
      {children}
    </motion.div>
  );
};
