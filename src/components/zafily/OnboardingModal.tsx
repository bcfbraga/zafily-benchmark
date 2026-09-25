"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

const GOALS = [
  "Organizar meus links",
  "Criar vitrines de produtos",
  "Melhorar a apresentação dos meus produtos",
  "Aumentar minhas vendas como afiliada",
  "Criar uma página profissional para minha audiência",
];

const PLATFORMS = ["Awin", "C&A", "Amazon", "Shopee", "Hotmart", "Outra"];

export function OnboardingModal({ initialUsername, onDone }: { initialUsername: string; onDone: () => void }) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState(initialUsername);
  const [instagramHandle, setInstagramHandle] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [goal, setGoal] = useState(GOALS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePlatform(p: string) {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName.trim() || null,
        username: username.trim() || undefined,
        instagramHandle: instagramHandle.trim() || null,
        platformsUsed: platforms.join(", ") || null,
        mainGoal: goal,
        onboardedAt: new Date().toISOString(),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Não foi possível salvar. Tente novamente.");
      return;
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0" style={{ background: "rgba(36,27,53,0.55)", backdropFilter: "blur(2px)" }} />
      <div
        className="relative w-full max-w-md rounded-[var(--cr-radius-xl)] p-7 max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--cr-surface)", boxShadow: "var(--cr-shadow-floating)" }}
      >
        <h2 className="cr-section-title mb-1.5" style={{ fontSize: "22px" }}>Vamos te conhecer</h2>
        <p className="cr-body-text text-sm mb-6">Duas perguntas rápidas para deixar sua vitrine com a sua cara.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--cr-text-secondary)" }}>Seu nome</label>
              <input
                type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Ex: Pam Braga" required
                className="cr-form-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--cr-text-secondary)" }}>Username</label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="pambraga" required
                className="cr-form-input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--cr-text-secondary)" }}>@ do Instagram, TikTok ou rede principal</label>
            <input
              type="text" value={instagramHandle} onChange={e => setInstagramHandle(e.target.value)}
              placeholder="@seuusuario"
              className="cr-form-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--cr-text-secondary)" }}>Plataformas de afiliados que você usa</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p} type="button" onClick={() => togglePlatform(p)}
                  className="cr-badge"
                  style={{
                    background: platforms.includes(p) ? "var(--cr-brand-600)" : "var(--cr-surface-soft)",
                    color: platforms.includes(p) ? "#fff" : "var(--cr-text-secondary)",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--cr-text-secondary)" }}>Seu objetivo principal com a Zafily</label>
            <select value={goal} onChange={e => setGoal(e.target.value)} className="cr-form-input">
              {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {error && <p className="text-sm" style={{ color: "var(--cr-danger)" }}>{error}</p>}

          <button type="submit" disabled={saving} className="cr-button-primary w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
