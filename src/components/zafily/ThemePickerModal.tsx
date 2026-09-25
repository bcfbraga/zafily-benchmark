"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Modal } from "@/components/zafily/Modal";
import { THEME_PRESETS, type DesignSettings } from "@/lib/design-presets";

/**
 * Seleção de tema, e só isso.
 *
 * A tela de Design permite ajustar cada peça separadamente (header, wallpaper,
 * botões, fontes, cores). Aqui é de propósito só a escolha do tema: escolher um
 * grava todos os campos do preset de uma vez, sem expor as peças.
 */
export function ThemePickerModal({
  current, photoUrl, onClose, onSaved,
}: {
  current: string;
  photoUrl: string | null;
  onClose: () => void;
  onSaved: (settings: DesignSettings) => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);

  async function selecionar(name: string) {
    const preset = THEME_PRESETS[name];
    if (!preset) return;
    const settings: DesignSettings = { ...preset.settings, theme: name };

    setSaving(name);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ designSettings: settings }),
    });
    setSaving(null);
    if (!res.ok) return;

    onSaved(settings);
    onClose();
  }

  return (
    <Modal open onClose={onClose} title="Tema da página pública" maxWidth="max-w-lg">
      <p className="text-sm mb-5" style={{ color: "var(--cr-text-secondary)" }}>
        O tema vale para a sua página e para as vitrines que você compartilha.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.entries(THEME_PRESETS).map(([name, preset]) => {
          const selecionado = name === current;
          const gravando = saving === name;
          return (
            <button
              key={name}
              onClick={() => selecionar(name)}
              disabled={!!saving}
              className={`relative rounded-2xl overflow-hidden border-2 transition-colors disabled:opacity-60 ${
                selecionado ? "border-[var(--cr-brand-500)]" : "border-transparent hover:border-black/[0.12]"
              }`}
            >
              {/* Miniatura: avatar + três botões, o suficiente para reconhecer
                  fundo, contraste e formato do botão */}
              <div className="aspect-[3/4] flex flex-col items-center pt-4 px-3 gap-1.5" style={{ background: preset.background }}>
                <div className="w-7 h-7 rounded-full overflow-hidden bg-white/25 flex items-center justify-center shrink-0">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold" style={{ color: preset.textColor }}>Aa</span>
                  )}
                </div>
                <div className="w-full mt-1 space-y-1.5">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="w-full h-4 rounded-full"
                      style={{
                        background: preset.buttonBg,
                        border: preset.buttonBorder ? `1px solid ${preset.buttonBorder}` : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>

              {(selecionado || gravando) && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--cr-brand-500)] flex items-center justify-center">
                  {gravando
                    ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                    : <Check className="w-3 h-3 text-white" />}
                </div>
              )}

              <div className="py-2 text-center text-xs font-semibold" style={{ background: "var(--surface-primary)", color: "var(--cr-text-primary)" }}>
                {name}
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
