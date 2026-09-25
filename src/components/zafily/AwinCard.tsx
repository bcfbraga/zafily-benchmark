"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Clock, Loader2, Unplug, RefreshCw, ExternalLink } from "lucide-react";
import { ZafilyBadge } from "./Badge";
import { AwinConnectModal } from "./AwinConnectModal";

type CardStatus = "disconnected" | "connecting" | "connected" | "pending_program_approval" | "error";

interface ConnectedData {
  publisherId: string;
  connectedAt: string;
  lastCheckedAt?: string;
}

export function AwinCard() {
  const [status, setStatus] = useState<CardStatus>("disconnected");
  const [connected, setConnected] = useState<ConnectedData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  function handleConnectClick() {
    setStatus("connecting");
    setShowModal(true);
  }

  function handleModalClose() {
    setShowModal(false);
    if (status === "connecting") setStatus("disconnected");
  }

  function handleSuccess(data: { status: string; publisherId: string; connectedAt: string }) {
    setShowModal(false);
    setConnected({ publisherId: data.publisherId, connectedAt: data.connectedAt });
    setStatus(data.status === "pending_program_approval" ? "pending_program_approval" : "connected");
  }

  async function handleTest() {
    setTesting(true);
    setTestMessage(null);
    try {
      const res = await fetch("/api/integrations/awin/test", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setStatus(data.status);
        setTestMessage("Conexão validada com sucesso.");
      } else {
        setStatus("error");
        setTestMessage(data.message ?? "Teste falhou. Verifique suas credenciais.");
      }
    } catch {
      setTestMessage("Não foi possível testar agora. Tente novamente.");
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/integrations/awin/disconnect", { method: "DELETE" });
      setStatus("disconnected");
      setConnected(null);
      setTestMessage(null);
    } catch {
      // Silent fail — let the user retry
    } finally {
      setDisconnecting(false);
    }
  }

  const isConnected = status === "connected" || status === "pending_program_approval";

  return (
    <>
      {showModal && (
        <AwinConnectModal onClose={handleModalClose} onSuccess={handleSuccess} />
      )}

      <div className={`rounded-[4px] border p-6 shadow-[0_16px_48px_rgba(23,23,60,0.10)] transition-all ${
        isConnected
          ? "bg-white border-[var(--cr-brand-500)]/30"
          : "bg-white border-black/[0.08]"
      }`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            {/* Awin logo */}
            <div
              className="w-11 h-11 rounded-[4px] flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #E6007E, #6C2EB5)" }}
            >
              <span className="font-heading font-bold text-sm text-white lowercase">awin</span>
            </div>
            <div>
              <p className="font-heading font-semibold text-[var(--cr-text-primary)]">Awin</p>
              <p className="text-xs text-[var(--cr-text-tertiary)] mt-0.5">Rede de afiliados</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Description */}
        {!isConnected && (
          <p className="text-sm text-[var(--cr-text-secondary)] leading-relaxed mb-5">
            Conecte sua conta Awin para gerar e rastrear links de afiliada. Os produtos
            e links criados no sistema ficam vinculados ao seu ID de afiliada.
          </p>
        )}

        {/* Pending approval notice */}
        {status === "pending_program_approval" && (
          <div className="flex items-start gap-2.5 bg-[rgba(255,200,87,0.14)] border border-[rgba(255,200,87,0.35)] rounded-[4px] p-3.5 mb-5">
            <Clock className="w-4 h-4 text-[#8A6A1B] shrink-0 mt-0.5" />
            <p className="text-sm text-[#8A6A1B] leading-snug">
              Sua conta Awin foi conectada, mas você ainda precisa se inscrever ou ser
              aprovada no <span className="font-semibold">programa C&A BR</span>.{" "}
              <a
                href="https://ui.awin.com/programmes"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                Abrir Awin
              </a>
            </p>
          </div>
        )}

        {/* Error notice */}
        {status === "error" && testMessage && (
          <div className="flex items-start gap-2.5 bg-[rgba(225,29,72,0.06)] border border-[rgba(225,29,72,0.20)] rounded-[4px] p-3.5 mb-5">
            <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0 mt-0.5" />
            <p className="text-sm text-[#E11D48]">{testMessage}</p>
          </div>
        )}

        {/* Connected info */}
        {isConnected && connected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <InfoRow label="Publisher ID" value={connected.publisherId} />
            <InfoRow label="Advertiser" value="C&A BR (#17648)" />
            <InfoRow label="Conectada em" value={formatDate(connected.connectedAt)} />
            {connected.lastCheckedAt && (
              <InfoRow label="Último teste" value={formatDate(connected.lastCheckedAt)} />
            )}
          </div>
        )}

        {/* Test success message */}
        {testMessage && status !== "error" && (
          <div className="flex items-center gap-2 text-xs text-[var(--cr-success)] mb-4">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {testMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isConnected && status !== "connecting" && (
            <button
              onClick={handleConnectClick}
              className="flex items-center gap-2 h-10 px-5 bg-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-700)] text-white text-sm font-semibold rounded-[4px] transition-colors"
            >
              Conectar Awin
            </button>
          )}

          {status === "connecting" && !showModal && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 h-10 px-5 bg-[var(--cr-brand-500)] text-white text-sm font-semibold rounded-[4px]"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Conectando...
            </button>
          )}

          {isConnected && (
            <>
              <button
                onClick={handleTest}
                disabled={testing}
                className="flex items-center gap-1.5 h-9 px-4 bg-[var(--cr-surface-soft)] border border-black/[0.08] text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] text-sm font-medium rounded-[4px] transition-colors disabled:opacity-50"
              >
                {testing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Testar conexão
              </button>

              <a
                href="https://ui.awin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-9 px-4 bg-[var(--cr-surface-soft)] border border-black/[0.08] text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] text-sm font-medium rounded-[4px] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Awin
              </a>

              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-1.5 h-9 px-4 text-[#E11D48] hover:bg-[rgba(225,29,72,0.06)] text-sm font-medium rounded-[4px] transition-colors disabled:opacity-50 ml-auto"
              >
                {disconnecting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Unplug className="w-3.5 h-3.5" />
                )}
                Desconectar
              </button>
            </>
          )}
        </div>

        {/* Requirement note */}
        {!isConnected && (
          <p className="text-[11px] text-[var(--cr-text-tertiary)] mt-4">
            Você precisa ter uma conta Awin e estar inscrita/aprovada no programa C&A BR.
          </p>
        )}
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: CardStatus }) {
  switch (status) {
    case "connected":
      return <ZafilyBadge variant="success">Conectada</ZafilyBadge>;
    case "pending_program_approval":
      return <ZafilyBadge variant="warning">Pendente aprovação</ZafilyBadge>;
    case "connecting":
      return <ZafilyBadge variant="info">Conectando</ZafilyBadge>;
    case "error":
      return <ZafilyBadge variant="error">Erro de conexão</ZafilyBadge>;
    default:
      return <ZafilyBadge variant="neutral">Não conectada</ZafilyBadge>;
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--cr-background)] rounded-[4px] px-3 py-2.5">
      <p className="text-[10px] text-[var(--cr-text-tertiary)] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-medium text-[var(--cr-text-primary)] truncate">{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
