import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PensieveCard } from "@/components/pensieve/PensieveCard";
import { GlyphButton } from "@/components/pensieve/GlyphButton";
import { PensieveInput } from "@/components/pensieve/PensieveInput";
import { DisplayHeading } from "@/components/pensieve/DisplayHeading";
import { MonoLabel } from "@/components/pensieve/MonoLabel";
import { FloatingParticles } from "@/components/pensieve/FloatingParticles";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      try {
        await apiFetch("/auth/sync", { method: "POST" });
      } catch (syncError) {
        console.error("Backend sync failed:", syncError);
      }
    }
    setLoading(false);
    
    if (error) {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      navigate("/journal/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-pen-black flex items-center justify-center px-6 film-grain">
      <FloatingParticles count={10} />

      <PensieveCard className="w-full max-w-md p-10 z-10">
        <div className="mb-8">
          <DisplayHeading className="text-4xl text-pen-white mb-3">Welcome back.</DisplayHeading>
          <MonoLabel>Your reflections await</MonoLabel>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <PensieveInput label="Email" type="email" value={email} onChange={setEmail} />
          <PensieveInput label="Password" type="password" value={password} onChange={setPassword} />

          <GlyphButton variant="primary" type="submit" className="w-full">
            Unlock Journal
          </GlyphButton>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-pen-800" />
          <MonoLabel>or</MonoLabel>
          <div className="flex-1 h-px bg-pen-800" />
        </div>

        <GlyphButton variant="ghost" className="w-full" onClick={() => navigate("/journal/dashboard")}>
          Continue as Guest
        </GlyphButton>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-3"
        >
          <MonoLabel className="text-[9px]">No data saved · Ephemeral session · Full privacy</MonoLabel>
        </motion.p>

        <p className="text-center mt-8">
          <button onClick={() => navigate("/signup")} className="font-mono text-xs text-pen-400 hover:text-pen-300 transition-colors">
            No account? Create one →
          </button>
        </p>
      </PensieveCard>
    </div>
  );
};

export default Login;
