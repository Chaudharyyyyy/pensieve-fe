import { useEffect, useState } from "react";

export const CursorEye = ({ className }: { className?: string }) => {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMouse({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const pupilX = (mouse.x - 0.5) * 16;
  const pupilY = (mouse.y - 0.5) * 10;

  return (
    <svg viewBox="0 0 120 60" className={className} fill="none">
      {/* Outer eye shape */}
      <path
        d="M10 30 Q60 -5 110 30 Q60 65 10 30Z"
        stroke="hsl(0 0% 67%)"
        strokeWidth="1"
        fill="none"
      />
      {/* Inner iris */}
      <circle cx={60 + pupilX} cy={30 + pupilY} r="14" stroke="hsl(0 0% 53%)" strokeWidth="0.8" fill="none" />
      {/* Pupil */}
      <circle cx={60 + pupilX} cy={30 + pupilY} r="6" fill="hsl(40 4% 78%)" />
      {/* Highlight */}
      <circle cx={60 + pupilX + 3} cy={30 + pupilY - 3} r="2" fill="hsl(40 7% 95%)" opacity="0.6" />
    </svg>
  );
};
