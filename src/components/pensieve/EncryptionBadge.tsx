import { Lock } from "lucide-react";
import { MonoLabel } from "./MonoLabel";

export const EncryptionBadge = ({ label = "END-TO-END ENCRYPTED" }: { label?: string }) => (
  <div className="flex items-center gap-2">
    <Lock className="w-3 h-3 text-pen-500" />
    <MonoLabel className="text-[9px]">{label}</MonoLabel>
  </div>
);
