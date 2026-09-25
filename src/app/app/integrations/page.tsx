"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/zafily/Topbar";
import { AwinCard } from "@/components/zafily/AwinCard";
import { ActivationGate } from "@/components/zafily/ActivationGate";
import { Info } from "lucide-react";
import type { AccountStatus } from "@/lib/lives-store";

interface ProfileSummary {
  accountStatus: AccountStatus;
  displayName: string | null;
  username: string;
  instagramHandle: string | null;
}

export default function IntegrationsPage() {
  const [profile, setProfile] = useState<ProfileSummary | null>(null);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(setProfile);
  }, []);

  return (
    <>
      <Topbar
        title="Integrações"
        description="Conecte suas contas de afiliada para gerar e rastrear links"
      />
      <main className="flex-1 overflow-y-auto scrollbar-hidden px-8 py-7">
        <div className="max-w-[720px] mx-auto space-y-6">

          {/* Info banner */}
          <div className="flex items-start gap-3 bg-[rgba(247, 89, 173,0.08)] border border-[rgba(247, 89, 173,0.20)] rounded-[4px] p-4">
            <Info className="w-4 h-4 text-[var(--cr-brand-500)] shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--cr-text-secondary)] leading-relaxed">
              Conecte sua conta de afiliada para que todos os links gerados no Zafily
              fiquem vinculados ao <span className="text-[var(--cr-text-primary)] font-medium">seu ID</span>, não ao da plataforma.
              Cada integração é validada diretamente com a rede.
            </p>
          </div>

          {/* Section */}
          <div>
            <h2 className="font-heading font-semibold text-[var(--cr-text-primary)] mb-1">Redes disponíveis</h2>
            <p className="text-xs text-[var(--cr-text-tertiary)] mb-4">
              Mais redes serão adicionadas em breve.
            </p>
            {profile && (
              <ActivationGate
                featureName="Integrações"
                title="Integrações disponíveis após ativação"
                description="Conecte suas contas de afiliada assim que sua vitrine estiver ativada."
                userStatus={profile.accountStatus}
                profile={profile}
              >
                <AwinCard />
              </ActivationGate>
            )}
          </div>

        </div>
      </main>
    </>
  );
}
