"use client";

import { useState } from "react";
import { X, ExternalLink, Lock, Loader2, AlertCircle } from "lucide-react";
import { Modal } from "./Modal";

interface Props {
  onClose: () => void;
  onSuccess: (data: { status: string; publisherId: string; connectedAt: string }) => void;
}

export function AwinConnectModal({ onClose, onSuccess }: Props) {
  const [apiToken, setApiToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/integrations/awin/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Falha na conexão. Tente novamente.");
        return;
      }

      onSuccess(data);
    } catch {
      setError("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-[480px]" radiusClassName="rounded-[4px]">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-heading font-bold text-xl text-[var(--cr-text-primary)]">Conectar Awin</h2>
            <p className="text-sm text-[var(--cr-text-tertiary)] mt-1">
              Informe sua API Key da Awin para vincular sua conta de afiliada.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[4px] text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-primary)] hover:bg-[var(--cr-surface-soft)] transition-colors shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info box */}
        <div className="bg-[rgba(247, 89, 173,0.08)] border border-[rgba(247, 89, 173,0.24)] rounded-[4px] p-4 mb-6 text-sm text-[var(--cr-text-secondary)] leading-relaxed">
          Sua conta de publisher é identificada automaticamente a partir da API Key —
          não é preciso informar o Publisher ID manualmente. O token fica criptografado
          e nunca é exibido novamente.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--cr-text-secondary)]">API Key</label>
            <div className="relative">
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Cole sua API Key aqui"
                required
                disabled={loading}
                className="w-full h-12 bg-[var(--cr-surface-soft)] border border-black/[0.10] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-[4px] px-4 pr-10 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:shadow-[0_0_0_4px_rgba(247, 89, 173,0.18)] transition-all disabled:opacity-50"
              />
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--cr-text-tertiary)]" />
            </div>
            <p className="text-[11px] text-[var(--cr-text-tertiary)]">
              Encontrada em Awin → Account → API credentials.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-[rgba(225,29,72,0.06)] border border-[rgba(225,29,72,0.20)] rounded-[4px] p-3.5">
              <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0 mt-0.5" />
              <p className="text-sm text-[#E11D48]">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={loading || !apiToken}
              className="flex-1 flex items-center justify-center gap-2 h-11 bg-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-700)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--cr-text-primary)] font-semibold rounded-[4px] transition-colors text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validando...
                </>
              ) : (
                "Conectar"
              )}
            </button>
            <a
              href="https://ui.awin.com/user/api-credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 h-11 px-4 bg-[var(--cr-surface-soft)] border border-black/[0.08] text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] text-sm font-medium rounded-[4px] transition-colors shrink-0"
            >
              Abrir Awin
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </form>

        {/* Security note */}
        <div className="mt-5 flex items-center gap-2 text-[11px] text-[var(--cr-text-tertiary)]">
          <Lock className="w-3 h-3 shrink-0" />
          Sua API Key é criptografada antes de ser salva e nunca fica visível após a conexão.
        </div>
    </Modal>
  );
}
