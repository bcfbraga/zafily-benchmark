"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingModal } from "./OnboardingModal";
import { createClient } from "@/lib/supabase-browser";

type State =
  | { kind: "loading" }
  | { kind: "ok" }
  | { kind: "blocked" }
  | { kind: "onboarding"; username: string };

export function AccountGate() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const router = useRouter();

  useEffect(() => {
    fetch("/api/profile").then(async r => {
      if (r.status === 403) {
        setState({ kind: "blocked" });
        return;
      }
      const profile = await r.json();
      if (profile && !profile.onboardedAt) {
        setState({ kind: "onboarding", username: profile.username });
        return;
      }
      setState({ kind: "ok" });
    });
  }, []);

  if (state.kind === "loading" || state.kind === "ok") return null;

  if (state.kind === "onboarding") {
    return <OnboardingModal initialUsername={state.username} onDone={() => setState({ kind: "ok" })} />;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0" style={{ background: "rgba(36,27,53,0.65)", backdropFilter: "blur(2px)" }} />
      <div
        className="relative w-full max-w-sm rounded-[var(--cr-radius-xl)] p-7 text-center"
        style={{ background: "var(--cr-surface)", boxShadow: "var(--cr-shadow-floating)" }}
      >
        <h2 className="cr-section-title mb-2" style={{ fontSize: "20px" }}>Seu acesso ainda está em análise</h2>
        <p className="cr-body-text text-sm mb-6">
          Recebemos sua conta, mas o acesso à Zafily é liberado individualmente. Avise quem te convidou ou aguarde
          que entraremos em contato.
        </p>
        <button
          type="button"
          onClick={async () => {
            await createClient().auth.signOut();
            router.push("/");
          }}
          className="cr-button-secondary w-full justify-center"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
