"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { CurrencyInput } from "@/components/zafily/CurrencyInput";

const SCOPE_OPTIONS = [
  "Reels / Feed",
  "Sequência de Stories",
  "Cobertura de Eventos",
  "Roteiro",
  "Gravação",
  "Deslocamento",
  "Direito de Uso de Imagem",
];

export default function NovoOrcamentoPage() {
  const router = useRouter();

  const [clientName, setClientName] = useState("");
  const [scopeItems, setScopeItems] = useState<string[]>([]);
  const [finalValue, setFinalValue] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleScope(option: string) {
    setScopeItems(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) { setError("Nome do cliente obrigatório"); return; }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: clientName.trim(),
        clientName: clientName.trim(),
        scopeItems,
        finalValue: finalValue ?? undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Erro ao salvar"); return; }
    router.push(`/app/orcamentos/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-[var(--cr-background)] text-[var(--cr-text-primary)]">
      <div className="border-b border-black/[0.08] bg-[var(--cr-background)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center">
          <Link href="/app/orcamentos" className="flex items-center gap-1.5 text-sm text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar para propostas
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-[var(--cr-text-primary)] mb-1">Nova proposta comercial</h1>
        <p className="text-[var(--cr-text-secondary)] text-sm mb-8">O restante (fotos, contatos, valor gerado etc.) você ajusta depois no editor.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Nome do cliente <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Ex: Loja XYZ"
              required
              autoFocus
              className="w-full h-12 bg-white border border-black/[0.12] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Escopo</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SCOPE_OPTIONS.map(option => {
                const checked = scopeItems.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleScope(option)}
                    className={`flex items-center gap-2.5 h-11 px-3 rounded-xl border text-left text-sm font-medium transition-colors ${
                      checked
                        ? "bg-[var(--cr-brand-500)]/15 border-[var(--cr-brand-500)] text-[var(--cr-brand-700)]"
                        : "bg-white border-black/[0.12] text-[var(--cr-text-secondary)] hover:border-black/[0.24]"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                      checked ? "bg-[var(--cr-brand-500)] border-[var(--cr-brand-500)]" : "border-black/[0.24]"
                    }`}>
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="truncate">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--cr-text-tertiary)]">R$</span>
              <CurrencyInput
                defaultValue={null}
                onChange={setFinalValue}
                className="w-full h-12 bg-white border border-black/[0.12] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 bg-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-700)] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : "Criar proposta"}
            </button>
            <Link
              href="/app/orcamentos"
              className="h-11 px-5 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] text-sm font-medium rounded-xl flex items-center justify-center transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
