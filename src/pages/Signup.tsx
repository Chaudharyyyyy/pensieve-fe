import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PensieveCard } from "@/components/pensieve/PensieveCard";
import { GlyphButton } from "@/components/pensieve/GlyphButton";
import { PensieveInput } from "@/components/pensieve/PensieveInput";
import { DisplayHeading } from "@/components/pensieve/DisplayHeading";
import { MonoLabel } from "@/components/pensieve/MonoLabel";
import { StrengthBar } from "@/components/pensieve/StrengthBar";
import { FloatingParticles } from "@/components/pensieve/FloatingParticles";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const getStrength = (pass: string): number => {
  let s = 0;
  if (pass.length >= 6) s++;
  if (pass.length >= 10) s++;
  if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) s++;
  if (/[^A-Za-z0-9]/.test(pass)) s++;
  return s;
};

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase !== confirm) {
      toast({ title: "Verification Failed", description: "Passphrases do not match.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: passphrase,
      options: {
        data: { full_name: name }
      }
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
      toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account Created", description: "Welcome to Pensieve.", variant: "default" });
      navigate("/journal/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-pen-black flex items-center justify-center px-6 film-grain">
      <FloatingParticles count={10} />

      <PensieveCard className="w-full max-w-md p-10 z-10">
        <div className="mb-8">
          <DisplayHeading className="text-4xl text-pen-white mb-3" italic={false}>Begin.</DisplayHeading>
          <MonoLabel>Zero-knowledge · Your mind, your keys</MonoLabel>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <PensieveInput label="Display Name" value={name} onChange={setName} />
          <PensieveInput label="Email" type="email" value={email} onChange={setEmail} />
          <div>
            <PensieveInput label="Passphrase" type="password" value={passphrase} onChange={setPassphrase} />
            <StrengthBar level={getStrength(passphrase)} />
          </div>
          <PensieveInput label="Confirm Passphrase" type="password" value={confirm} onChange={setConfirm} />

          <GlyphButton variant="primary" type="submit" className="w-full">
            Create My Archive
          </GlyphButton>
        </form>

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
          <button onClick={() => navigate("/login")} className="font-mono text-xs text-pen-400 hover:text-pen-300 transition-colors">
            Already have an account? Sign in →
          </button>
        </p>
      </PensieveCard>
    </div>
  );
};

export default Signup;
