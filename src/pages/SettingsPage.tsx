import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DisplayHeading } from "@/components/pensieve/DisplayHeading";
import { MonoLabel } from "@/components/pensieve/MonoLabel";
import { PensieveCard } from "@/components/pensieve/PensieveCard";
import { GlyphButton } from "@/components/pensieve/GlyphButton";
import { EncryptionBadge } from "@/components/pensieve/EncryptionBadge";
import { PensieveInput } from "@/components/pensieve/PensieveInput";
import { ArrowLeft } from "lucide-react";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("Anonymous");

  return (
    <div className="min-h-screen bg-pen-black film-grain p-6 lg:p-12">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate("/journal")} className="flex items-center gap-2 text-pen-400 hover:text-pen-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <MonoLabel>Back to Journal</MonoLabel>
        </button>

        <DisplayHeading className="text-4xl text-pen-white mb-10">Settings</DisplayHeading>

        <PensieveCard className="p-8 mb-6" tilt={false}>
          <MonoLabel className="block mb-6">Account</MonoLabel>
          <PensieveInput label="Display Name" value={displayName} onChange={setDisplayName} />
          <div className="mt-6">
            <GlyphButton variant="primary">Save Changes</GlyphButton>
          </div>
        </PensieveCard>

        <PensieveCard className="p-8" tilt={false}>
          <MonoLabel className="block mb-4">Security & Privacy</MonoLabel>
          <EncryptionBadge label="AES-256-GCM · Client-side encryption active" />
          <p className="font-mono text-[10px] text-pen-500 mt-4 leading-relaxed">
            All journal entries are encrypted on your device before transmission. Your passphrase never leaves this browser. We cannot read your entries.
          </p>
        </PensieveCard>
      </div>
    </div>
  );
};

export default SettingsPage;
