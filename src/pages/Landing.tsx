import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { OrbScene } from "@/components/pensieve/OrbScene";
import { CursorEye } from "@/components/pensieve/CursorEye";
import { GlyphButton } from "@/components/pensieve/GlyphButton";
import { MonoLabel } from "@/components/pensieve/MonoLabel";
import { StatusDot } from "@/components/pensieve/StatusDot";
import { FloatingParticles } from "@/components/pensieve/FloatingParticles";
import { useIsMobile } from "@/hooks/use-mobile";

const Landing = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="relative min-h-screen bg-pen-black overflow-hidden film-grain vignette">
      {/* Three.js Orb Background */}
      {!isMobile && (
        <div className="absolute inset-0 z-0">
          <OrbScene />
        </div>
      )}

      <FloatingParticles count={15} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Eye on mobile, orb on desktop is behind */}
        {isMobile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-12"
          >
            <CursorEye className="w-32 h-16" />
          </motion.div>
        )}

        {!isMobile && <div className="h-48" />}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="font-display text-7xl md:text-8xl font-light italic text-pen-white tracking-[0.15em] mb-6"
        >
          Pensieve
        </motion.h1>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <MonoLabel className="text-[11px] tracking-[0.2em]">
            REFLECTIVE INTELLIGENCE · PRIVACY FIRST
          </MonoLabel>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="flex flex-col items-center gap-4 mt-16"
        >
          <GlyphButton variant="primary" onClick={() => navigate("/login")}>
            Enter the Archive
          </GlyphButton>
          <GlyphButton variant="ghost" onClick={() => navigate("/signup")}>
            Create Account
          </GlyphButton>
          <GlyphButton variant="text" onClick={() => navigate("/journal")}>
            Continue as guest — no account needed
          </GlyphButton>
        </motion.div>

        {/* Encryption status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.6 }}
          className="absolute bottom-8 flex items-center gap-3"
        >
          <StatusDot />
          <MonoLabel className="text-[9px]">END-TO-END ENCRYPTED</MonoLabel>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
