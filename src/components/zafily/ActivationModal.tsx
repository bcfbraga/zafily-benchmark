"use client";

import { X, Palette, Link2, Sparkles, PackageCheck, MessageCircle } from "lucide-react";
import { buildActivationWhatsappLink } from "@/lib/whatsapp";
import { Modal } from "./Modal";

const INCLUDED_ITEMS = [
  { icon: Sparkles, label: "Configuração da página" },
  { icon: Link2, label: "Revisão dos links e vitrines" },
  { icon: Palette, label: "Personalização visual" },
  { icon: PackageCheck, label: "Organização inicial dos produtos" },
  { icon: MessageCircle, label: "Suporte direto para colocar tudo no ar" },
];

export function ActivationModal({ onClose, profile }: {
  onClose: () => void;
  profile?: { displayName?: string | null; username?: string | null; instagramHandle?: string | null } | null;
}) {
  const whatsappLink = buildActivationWhatsappLink(profile);

  return (
    <Modal open onClose={onClose} maxWidth="max-w-md" radiusClassName="rounded-[var(--cr-radius-xl)]">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
        style={{ color: "var(--cr-text-tertiary)" }}
      >
        <X className="w-4 h-4" />
      </button>

      <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--cr-brand-100)" }}>
        <Sparkles className="w-5 h-5" style={{ color: "var(--cr-brand-700)" }} />
      </div>

      <h2 className="cr-section-title mb-2" style={{ fontSize: "22px" }}>Sua vitrine está quase pronta</h2>
      <p className="cr-body-text mb-5">
        Para garantir que sua página fique profissional, organizada e preparada para gerar vendas, a publicação é feita com uma ativação personalizada.
      </p>

      <div className="space-y-2.5 mb-6">
        {INCLUDED_ITEMS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cr-brand-50)" }}>
              <Icon className="w-3.5 h-3.5" style={{ color: "var(--cr-brand-600)" }} />
            </div>
            <span className="text-sm" style={{ color: "var(--cr-text-primary)" }}>{label}</span>
          </div>
        ))}
      </div>

      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="cr-button-primary w-full mb-2.5"
      >
        Quero ativar minha vitrine
      </a>
      <button onClick={onClose} className="cr-button-secondary w-full">
        Continuar editando
      </button>
    </Modal>
  );
}
