"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { accessSection } from "@/lib/landing-copy";
import { Surface, SectionGrid, Col, SectionLabel } from "@/components/zafily/ds";

const FOLLOWERS_RANGES = [
  "Prefiro não informar",
  "Menos de 5 mil",
  "5 mil a 20 mil",
  "20 mil a 100 mil",
  "Mais de 100 mil",
];

const inputClass =
  "w-full h-11 px-3.5 text-sm bg-[var(--surface-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] focus:outline-none focus:border-[var(--cr-brand-500)] transition-colors";
const labelClass = "block text-xs font-medium mb-1.5 text-[var(--cr-text-secondary)]";

export function AccessSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [followersRange, setFollowersRange] = useState(FOLLOWERS_RANGES[0]);
  const [platforms, setPlatforms] = useState("");
  const [currentDelivery, setCurrentDelivery] = useState("");
  const [biggestDifficulty, setBiggestDifficulty] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/access-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, socialHandle, followersRange, platforms, currentDelivery, biggestDifficulty }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível enviar. Tente novamente.");
      return;
    }
    setSubmitted(true);
  }

  return (
    <div id="acesso" className="scroll-mt-24">
      <Surface tone="dark" size="lg">
        <SectionGrid>
          {/* 5/7 — o formulário pesa mais que o argumento, é a ação da página */}
          <Col span={5}>
            <div className="mb-4">
              <SectionLabel tone="on-dark">{accessSection.eyebrow}</SectionLabel>
            </div>
            <h2
              className="font-bold text-white leading-[1.08] tracking-[-0.025em]"
              style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(28px, 3.4vw, 46px)" }}
            >
              {accessSection.headline}
            </h2>
            <p className="mt-5 text-[15px] leading-[1.65]" style={{ color: "rgba(255,255,255,0.66)" }}>
              {accessSection.copy}
            </p>
            <ul className="mt-8 flex flex-col gap-3">
              {accessSection.benefits.map(b => (
                <li key={b} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>
                  <Check className="w-4 h-4 shrink-0" style={{ color: "var(--cr-brand-500)" }} />
                  {b}
                </li>
              ))}
            </ul>
          </Col>

          <Col span={7} className="mt-10 lg:mt-0">
            <div
              className="p-6 sm:p-8"
              style={{ background: "var(--surface-primary)", borderRadius: "var(--radius-lg)" }}
            >
              {submitted ? (
                <div className="flex flex-col items-center text-center py-10">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                    style={{ background: "var(--surface-brand)" }}
                  >
                    <Check className="w-6 h-6" style={{ color: "var(--cr-brand-600)" }} />
                  </div>
                  <p className="font-medium leading-relaxed max-w-[42ch]">{accessSection.successMessage}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="font-semibold text-lg mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                    {accessSection.formTitle}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="ar-name">Nome</label>
                      <input id="ar-name" required value={name} onChange={e => setName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="ar-email">E-mail</label>
                      <input id="ar-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="ar-handle">Instagram ou TikTok</label>
                      <input id="ar-handle" placeholder="@seuusuario" value={socialHandle} onChange={e => setSocialHandle(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="ar-followers">Seguidores (aproximado)</label>
                      <select id="ar-followers" value={followersRange} onChange={e => setFollowersRange(e.target.value)} className={inputClass}>
                        {FOLLOWERS_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="ar-platforms">Principais programas ou marcas com que trabalha</label>
                    <input id="ar-platforms" placeholder="Ex: Awin, C&A, Shopee..." value={platforms} onChange={e => setPlatforms(e.target.value)} className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="ar-delivery">Como você entrega os links hoje?</label>
                    <input id="ar-delivery" placeholder="Ex: mensagem no Direct, automação..." value={currentDelivery} onChange={e => setCurrentDelivery(e.target.value)} className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="ar-difficulty">
                      Qual é a maior dificuldade da sua operação?{" "}
                      <span style={{ color: "var(--cr-text-tertiary)" }}>(opcional)</span>
                    </label>
                    <textarea
                      id="ar-difficulty"
                      rows={3}
                      value={biggestDifficulty}
                      onChange={e => setBiggestDifficulty(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm resize-none bg-[var(--surface-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] focus:outline-none focus:border-[var(--cr-brand-500)] transition-colors"
                    />
                  </div>

                  {error && (
                    <div
                      className="text-sm px-3.5 py-2.5"
                      style={{ color: "#B3123F", background: "#FDECEF", borderRadius: "var(--radius-sm)" }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 flex items-center justify-center gap-2 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ background: "var(--cr-brand-500)", borderRadius: "var(--radius-full)" }}
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : accessSection.formTitle}
                  </button>

                  <p className="text-xs text-center" style={{ color: "var(--cr-text-tertiary)" }}>{accessSection.microcopy}</p>
                </form>
              )}
            </div>
          </Col>
        </SectionGrid>
      </Surface>
    </div>
  );
}
