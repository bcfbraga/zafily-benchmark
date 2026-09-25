"use client";

import { Lock } from "lucide-react";
import { buildActivationWhatsappLink } from "@/lib/whatsapp";
import type { AccountStatus } from "@/lib/lives-store";

interface ActivationGateProps {
  featureName: string;
  title?: string;
  description?: string;
  userStatus: AccountStatus;
  profile?: { displayName?: string | null; username?: string | null; instagramHandle?: string | null } | null;
  children: React.ReactNode;
}

export function ActivationGate({ featureName, title, description, userStatus, profile, children }: ActivationGateProps) {
  if (userStatus === "active") return <>{children}</>;

  const whatsappLink = buildActivationWhatsappLink(profile);

  return (
    <div className="relative rounded-[var(--cr-radius-xl)] overflow-hidden">
      <div className="pointer-events-none select-none blur-[3px] opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 py-8" style={{ background: "rgba(251,250,255,0.72)" }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center mb-3" style={{ background: "var(--cr-brand-100)" }}>
          <Lock className="w-5 h-5" style={{ color: "var(--cr-brand-700)" }} />
        </div>
        <span className="cr-badge mb-3">Disponível após ativação</span>
        <h3 className="cr-card-title mb-1.5">{title ?? featureName}</h3>
        {description && <p className="cr-body-text text-sm max-w-xs mb-5">{description}</p>}
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="cr-button-primary">
          Quero ativar minha vitrine
        </a>
      </div>
    </div>
  );
}
