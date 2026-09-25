"use client";

import { useEffect, useState } from "react";
import { Check, X, Copy, CheckCheck, Clock } from "lucide-react";
import { Topbar } from "@/components/zafily/Topbar";
import { PLAN_OPTIONS } from "@/lib/plans";

type Status = "pending" | "approved" | "rejected";

const TRIAL_DAYS = 7;

interface AccessRequest {
  id: string;
  name: string;
  email: string;
  socialHandle: string | null;
  followersRange: string | null;
  platforms: string | null;
  currentDelivery: string | null;
  biggestDifficulty: string | null;
  status: Status;
  inviteToken: string | null;
  inviteTokenUsedAt: string | null;
  createdAt: string;
  accountUserId: string | null;
  plan: string | null;
}

function StatusPill({ status }: { status: Status }) {
  const map = {
    pending: { label: "Pendente", bg: "var(--cr-surface-soft)", color: "var(--cr-text-secondary)" },
    approved: { label: "Aprovado", bg: "#e7f7ef", color: "#287451" },
    rejected: { label: "Rejeitado", bg: "#fdeceb", color: "var(--cr-danger)" },
  }[status];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: map.bg, color: map.color }}>
      {map.label}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-medium" style={{ color: "var(--cr-text-tertiary)" }}>{label}</p>
      <p className="text-sm" style={{ color: "var(--cr-text-primary)" }}>{value}</p>
    </div>
  );
}

function getTrialInfo(usedAt: string) {
  const elapsedMs = Date.now() - new Date(usedAt).getTime();
  const elapsedDays = Math.floor(elapsedMs / 86_400_000);
  const remaining = TRIAL_DAYS - elapsedDays;
  return { elapsedDays, remaining, expired: remaining <= 0 };
}

function TrialStatus({ usedAt }: { usedAt: string }) {
  const { elapsedDays, remaining, expired } = getTrialInfo(usedAt);

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: expired ? "#fdeceb" : "var(--cr-brand-100)", color: expired ? "var(--cr-danger)" : "var(--cr-brand-700)" }}
    >
      <Clock className="w-3 h-3" />
      {expired
        ? `Trial expirado há ${Math.abs(remaining)} dia${Math.abs(remaining) === 1 ? "" : "s"}`
        : `Dia ${elapsedDays + 1} de ${TRIAL_DAYS} · faltam ${remaining} dia${remaining === 1 ? "" : "s"}`}
    </span>
  );
}

export default function AdminAccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/access-requests")
      .then(async r => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          setLoadError(
            r.status === 403
              ? "Seu login não está reconhecido como admin (ADMIN_EMAILS). Confira essa variável de ambiente no Vercel e refaça o deploy."
              : body.error ?? "Não foi possível carregar os pedidos."
          );
          setLoading(false);
          return;
        }
        const data = await r.json();
        setOrigin(window.location.origin);
        setRequests(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  async function approve(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/admin/access-requests/${id}/approve`, { method: "POST" });
    const updated = await res.json();
    setBusyId(null);
    if (res.ok) setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
  }

  async function reject(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/admin/access-requests/${id}/reject`, { method: "POST" });
    const updated = await res.json();
    setBusyId(null);
    if (res.ok) setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
  }

  async function changePlan(request: AccessRequest, plan: string) {
    if (!request.accountUserId) return;
    setRequests(prev => prev.map(r => r.id === request.id ? { ...r, plan } : r));
    await fetch(`/api/admin/users/${request.accountUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
  }

  function copyInvite(id: string, token: string) {
    navigator.clipboard.writeText(`${origin}/signup?invite=${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(prev => prev === id ? null : prev), 2000);
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Pedidos de acesso" description="Aprovar ou rejeitar solicitações vindas da landing page" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {loadError ? (
          <div className="max-w-3xl p-4 rounded-xl text-sm" style={{ background: "#fdeceb", border: "1px solid #f3c9c9", color: "var(--cr-danger)" }}>
            {loadError}
          </div>
        ) : loading ? (
          <div className="max-w-3xl space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "var(--cr-surface-soft)" }} />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="cr-empty-state">
            <p className="cr-body-text">Nenhum pedido de acesso ainda.</p>
          </div>
        ) : (
          <div className="max-w-3xl space-y-3">
            {requests.map(r => (
              <div key={r.id} className="p-4 rounded-xl border" style={{ background: "var(--cr-surface)", borderColor: "var(--cr-border)" }}>
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: "var(--cr-text-primary)" }}>{r.name}</p>
                      <StatusPill status={r.status} />
                      {r.inviteTokenUsedAt && <TrialStatus usedAt={r.inviteTokenUsedAt} />}
                    </div>
                    <p className="text-xs" style={{ color: "var(--cr-text-tertiary)" }}>{r.email}</p>
                  </div>
                  {r.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => approve(r.id)}
                        disabled={busyId === r.id}
                        className="h-8 px-3 flex items-center gap-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-50 transition-colors"
                        style={{ background: "var(--cr-brand-600)" }}
                      >
                        <Check className="w-3.5 h-3.5" /> Aprovar
                      </button>
                      <button
                        onClick={() => reject(r.id)}
                        disabled={busyId === r.id}
                        className="h-8 px-3 flex items-center gap-1.5 text-xs font-semibold rounded-lg border disabled:opacity-50 transition-colors"
                        style={{ borderColor: "var(--cr-border-strong)", color: "var(--cr-text-secondary)" }}
                      >
                        <X className="w-3.5 h-3.5" /> Rejeitar
                      </button>
                    </div>
                  )}
                  {r.accountUserId && (
                    <div className="shrink-0">
                      <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--cr-text-tertiary)" }}>Plano</label>
                      <select
                        value={r.plan ?? ""}
                        onChange={e => changePlan(r, e.target.value)}
                        className="h-8 rounded-lg border px-2 text-xs"
                        style={{ borderColor: "var(--cr-border-strong)", color: "var(--cr-text-primary)", background: "var(--cr-surface)" }}
                      >
                        <option value="" disabled>Não definido</option>
                        {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-1">
                  <Field label="Rede social" value={r.socialHandle} />
                  <Field label="Seguidores" value={r.followersRange} />
                  <Field label="Programas / marcas" value={r.platforms} />
                  <Field label="Como entrega hoje" value={r.currentDelivery} />
                  <Field label="Maior dificuldade" value={r.biggestDifficulty} />
                </div>

                {r.status === "approved" && r.inviteToken && (
                  <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "var(--cr-surface-soft)" }}>
                    <code className="flex-1 text-xs truncate" style={{ color: "var(--cr-text-secondary)" }}>
                      {origin}/signup?invite={r.inviteToken}
                    </code>
                    <button
                      onClick={() => copyInvite(r.id, r.inviteToken!)}
                      className="w-7 h-7 flex items-center justify-center rounded-md shrink-0"
                      style={{ color: "var(--cr-brand-600)" }}
                      title="Copiar link de convite"
                    >
                      {copiedId === r.id ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {r.inviteTokenUsedAt ? (
                      <span className="text-[11px] font-medium shrink-0" style={{ color: "var(--cr-success)" }}>convertido</span>
                    ) : (
                      <span className="text-[11px] font-medium shrink-0" style={{ color: "var(--cr-text-tertiary)" }}>aguardando cadastro</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
