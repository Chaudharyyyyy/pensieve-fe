import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DisplayHeadingProps {
  children: string;
  className?: string;
  italic?: boolean;
  as?: "h1" | "h2" | "h3";
}

export const DisplayHeading = ({ children, className, italic = true, as: Tag = "h1" }: DisplayHeadingProps) => {
  const words = children.split(" ");

  return (
    <Tag className={cn("font-display font-light", italic && "italic", className)}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.3em]">
          <motion.span
            className="inline-block"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{
              duration: 0.5,
              delay: i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
};
