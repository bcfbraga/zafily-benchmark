"use client";

import { useEffect, useState } from "react";
import { Key, Ban, ShieldCheck, Trash2, Copy, CheckCheck, Loader2, LayoutGrid, Pencil, Plus } from "lucide-react";
import { Topbar } from "@/components/zafily/Topbar";
import { Modal } from "@/components/zafily/Modal";
import { PLAN_OPTIONS } from "@/lib/plans";

interface ManagedUser {
  id: string;
  email: string;
  createdAt: string;
  emailConfirmedAt: string | null;
  bannedUntil: string | null;
  username: string | null;
  accountStatus: string | null;
  plan: string | null;
  planExpiresAt: string | null;
  liveCount: number;
  activeLiveCount: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function isBanned(bannedUntil: string | null): boolean {
  return !!bannedUntil && new Date(bannedUntil).getTime() > Date.now();
}

function isPlanExpired(planExpiresAt: string | null): boolean {
  return !!planExpiresAt && new Date(planExpiresAt).getTime() < Date.now();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [planTarget, setPlanTarget] = useState<ManagedUser | null>(null);
  const [planValue, setPlanValue] = useState("");
  const [planExpiresValue, setPlanExpiresValue] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(async r => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          setLoadError(
            r.status === 403
              ? "Seu login não está reconhecido como admin (ADMIN_EMAILS). Confira essa variável de ambiente no Vercel e refaça o deploy."
              : body.error ?? "Não foi possível carregar os usuários."
          );
          setLoading(false);
          return;
        }
        const data = await r.json();
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  async function createUser() {
    setCreateBusy(true);
    setCreateError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, email: newEmail }),
    });
    const data = await res.json().catch(() => ({}));
    setCreateBusy(false);
    if (!res.ok) { setCreateError(data.error ?? "Erro ao criar usuário"); return; }

    // A senha só aparece aqui: não fica guardada em lugar nenhum
    setCreatedUser({ email: data.email, password: data.password });
    setNewName(""); setNewEmail("");
    fetch("/api/admin/users").then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : []));
  }

  async function resetPassword(id: string) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/users/${id}/reset-password`, { method: "POST" });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) { setError(data.error ?? "Erro ao resetar senha"); return; }
    setNewPasswords(prev => ({ ...prev, [id]: data.password }));
  }

  async function toggleBan(user: ManagedUser) {
    setBusyId(user.id);
    setError(null);
    const banned = isBanned(user.bannedUntil);
    const res = await fetch(`/api/admin/users/${user.id}/${banned ? "unban" : "ban"}`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) { setError(data.error ?? "Erro ao atualizar status"); return; }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, bannedUntil: banned ? null : "9999-01-01T00:00:00Z" } : u));
  }

  function openPlanEditor(user: ManagedUser) {
    setPlanTarget(user);
    setPlanValue(user.plan ?? "");
    setPlanExpiresValue(user.planExpiresAt ? user.planExpiresAt.slice(0, 10) : "");
  }

  async function savePlan() {
    if (!planTarget) return;
    setSavingPlan(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${planTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: planValue || null,
        // Fixed at UTC noon so the calendar date survives timezone conversion
        // on both write and read — a plain `new Date(dateOnly)` treats it as
        // UTC midnight, which rolls back a day in any timezone behind UTC.
        planExpiresAt: planExpiresValue ? `${planExpiresValue}T12:00:00.000Z` : null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingPlan(false);
    if (!res.ok) { setError(data.error ?? "Erro ao salvar plano"); return; }
    setUsers(prev => prev.map(u => u.id === planTarget.id ? { ...u, plan: data.plan, planExpiresAt: data.planExpiresAt } : u));
    setPlanTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setError(null);
    const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) { setError(data.error ?? "Erro ao excluir conta"); return; }
    setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    setDeleteTarget(null);
    setConfirmText("");
  }

  function copyPassword(id: string, password: string) {
    navigator.clipboard.writeText(password);
    setCopiedId(id);
    setTimeout(() => setCopiedId(prev => prev === id ? null : prev), 2000);
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="Usuários"
        description="Contas cadastradas na Zafily"
        action={
          <button
            onClick={() => { setCreating(true); setCreateError(null); setCreatedUser(null); }}
            className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-white rounded-[var(--radius-md)] transition-opacity hover:opacity-90"
            style={{ background: "var(--surface-dark)" }}
          >
            <Plus className="w-4 h-4" /> Novo usuário
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="max-w-4xl mb-4 p-3 rounded-xl text-sm" style={{ background: "#fdeceb", border: "1px solid #f3c9c9", color: "var(--cr-danger)" }}>
            {error}
          </div>
        )}

        {loadError ? (
          <div className="max-w-4xl p-4 rounded-xl text-sm" style={{ background: "#fdeceb", border: "1px solid #f3c9c9", color: "var(--cr-danger)" }}>
            {loadError}
          </div>
        ) : loading ? (
          <div className="max-w-4xl space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--cr-surface-soft)" }} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="cr-empty-state">
            <p className="cr-body-text">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <div className="max-w-4xl space-y-3">
            {users.map(user => {
              const banned = isBanned(user.bannedUntil);
              return (
                <div key={user.id} className="p-4 rounded-xl border" style={{ background: "var(--cr-surface)", borderColor: "var(--cr-border)" }}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-semibold" style={{ color: "var(--cr-text-primary)" }}>{user.email}</p>
                        {user.emailConfirmedAt ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "#e7f7ef", color: "#287451" }}>
                            <ShieldCheck className="w-3 h-3" /> Confirmado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "var(--cr-surface-soft)", color: "var(--cr-text-tertiary)" }}>
                            Não confirmado
                          </span>
                        )}
                        {banned && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "#fdeceb", color: "var(--cr-danger)" }}>
                            Banido
                          </span>
                        )}
                      </div>
                      <p className="text-xs mb-2" style={{ color: "var(--cr-text-tertiary)" }}>
                        {user.username ? `@${user.username} · ` : ""}criado em {formatDate(user.createdAt)}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: "var(--cr-text-secondary)" }}>
                        <span className="inline-flex items-center gap-1.5">
                          <LayoutGrid className="w-3.5 h-3.5" style={{ color: "var(--cr-text-tertiary)" }} />
                          {user.activeLiveCount} ativa{user.activeLiveCount === 1 ? "" : "s"} de {user.liveCount} vitrine{user.liveCount === 1 ? "" : "s"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-medium" style={{ color: user.plan ? "var(--cr-text-primary)" : "var(--cr-text-tertiary)" }}>
                            {user.plan ?? "Plano não definido"}
                          </span>
                          {user.planExpiresAt && (
                            <span style={{ color: isPlanExpired(user.planExpiresAt) ? "var(--cr-danger)" : "var(--cr-text-tertiary)" }}>
                              · {isPlanExpired(user.planExpiresAt) ? "venceu em" : "vence em"} {formatDate(user.planExpiresAt)}
                            </span>
                          )}
                          <button onClick={() => openPlanEditor(user)} className="w-5 h-5 inline-flex items-center justify-center rounded" style={{ color: "var(--cr-brand-600)" }} title="Editar plano">
                            <Pencil className="w-3 h-3" />
                          </button>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => resetPassword(user.id)}
                        disabled={busyId === user.id}
                        title="Resetar senha"
                        className="h-8 px-3 flex items-center gap-1.5 text-xs font-semibold rounded-lg border disabled:opacity-50 transition-colors"
                        style={{ borderColor: "var(--cr-border-strong)", color: "var(--cr-text-secondary)" }}
                      >
                        <Key className="w-3.5 h-3.5" /> Resetar senha
                      </button>
                      <button
                        onClick={() => toggleBan(user)}
                        disabled={busyId === user.id}
                        title={banned ? "Desbanir" : "Banir"}
                        className="h-8 px-3 flex items-center gap-1.5 text-xs font-semibold rounded-lg border disabled:opacity-50 transition-colors"
                        style={{ borderColor: "var(--cr-border-strong)", color: banned ? "var(--cr-success)" : "var(--cr-text-secondary)" }}
                      >
                        <Ban className="w-3.5 h-3.5" /> {banned ? "Desbanir" : "Banir"}
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(user); setConfirmText(""); }}
                        disabled={busyId === user.id}
                        title="Excluir conta"
                        className="h-8 px-3 flex items-center gap-1.5 text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                        style={{ color: "var(--cr-danger)" }}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    </div>
                  </div>

                  {newPasswords[user.id] && (
                    <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "var(--cr-surface-soft)" }}>
                      <span className="text-xs shrink-0" style={{ color: "var(--cr-text-tertiary)" }}>Nova senha:</span>
                      <code className="flex-1 text-xs" style={{ color: "var(--cr-text-secondary)" }}>{newPasswords[user.id]}</code>
                      <button
                        onClick={() => copyPassword(user.id, newPasswords[user.id])}
                        className="w-7 h-7 flex items-center justify-center rounded-md shrink-0"
                        style={{ color: "var(--cr-brand-600)" }}
                      >
                        {copiedId === user.id ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {planTarget && (
        <Modal open onClose={() => setPlanTarget(null)} title="Editar plano">
          <p className="text-sm mb-4" style={{ color: "var(--cr-text-secondary)" }}>{planTarget.email}</p>

          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--cr-text-secondary)" }}>Plano</label>
          <select
            value={planValue}
            onChange={e => setPlanValue(e.target.value)}
            className="w-full h-11 rounded-xl px-3 text-sm mb-4 focus:outline-none"
            style={{ background: "var(--cr-background)", border: "1px solid var(--cr-border-strong)", color: "var(--cr-text-primary)" }}
          >
            <option value="">Não definido</option>
            {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--cr-text-secondary)" }}>Vencimento</label>
          <input
            type="date"
            value={planExpiresValue}
            onChange={e => setPlanExpiresValue(e.target.value)}
            className="w-full h-11 rounded-xl px-3 text-sm mb-5 focus:outline-none"
            style={{ background: "var(--cr-background)", border: "1px solid var(--cr-border-strong)", color: "var(--cr-text-primary)" }}
          />

          <div className="flex gap-3">
            <button
              onClick={savePlan}
              disabled={savingPlan}
              className="flex-1 h-10 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              style={{ background: "var(--cr-brand-600)" }}
            >
              {savingPlan ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar"}
            </button>
            <button
              onClick={() => setPlanTarget(null)}
              className="h-10 px-4 border rounded-xl text-sm transition-colors"
              style={{ borderColor: "var(--cr-border)", color: "var(--cr-text-secondary)" }}
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal open onClose={() => setDeleteTarget(null)} title="Excluir conta">
          <p className="text-sm mb-1" style={{ color: "var(--cr-text-secondary)" }}>
            Isso apaga permanentemente a conta de <strong>{deleteTarget.email}</strong> e todos os dados dela —
            vitrines, produtos, links, orçamentos e integrações. Não pode ser desfeito.
          </p>
          <p className="text-sm mb-3" style={{ color: "var(--cr-text-secondary)" }}>
            Digite o e-mail da conta para confirmar:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            className="w-full h-11 rounded-xl px-4 text-sm mb-4 focus:outline-none"
            style={{ background: "var(--cr-background)", border: "1px solid var(--cr-border-strong)", color: "var(--cr-text-primary)" }}
          />
          <div className="flex gap-3">
            <button
              onClick={confirmDelete}
              disabled={confirmText !== deleteTarget.email || busyId === deleteTarget.id}
              className="flex-1 h-10 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              style={{ background: "var(--cr-danger)" }}
            >
              {busyId === deleteTarget.id ? <><Loader2 className="w-4 h-4 animate-spin" /> Excluindo...</> : "Excluir permanentemente"}
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              className="h-10 px-4 border rounded-xl text-sm transition-colors"
              style={{ borderColor: "var(--cr-border)", color: "var(--cr-text-secondary)" }}
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}
      {creating && (
        <Modal open onClose={() => setCreating(false)} title={createdUser ? "Conta criada" : "Novo usuário"}>
          {createdUser ? (
            // A senha aparece uma vez só; depois disso nem o admin recupera
            <div>
              <p className="text-sm mb-5" style={{ color: "var(--cr-text-secondary)" }}>
                Anote a senha agora — ela não fica guardada e não dá para vê-la de novo.
                Peça para a pessoa trocá-la no primeiro acesso.
              </p>

              <div className="p-4 rounded-xl mb-5" style={{ background: "var(--surface-secondary)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--cr-text-tertiary)" }}>E-mail</p>
                <p className="text-sm font-medium mb-3" style={{ color: "var(--cr-text-primary)" }}>{createdUser.email}</p>
                <p className="text-xs mb-1" style={{ color: "var(--cr-text-tertiary)" }}>Senha temporária</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm px-3 py-2 rounded-lg" style={{ background: "var(--surface-primary)", fontFamily: "var(--font-data)" }}>
                    {createdUser.password}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${createdUser.email}\n${createdUser.password}`);
                      setCopiedId("novo");
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
                    style={{ background: "var(--surface-primary)", color: "var(--cr-text-secondary)" }}
                    title="Copiar e-mail e senha"
                  >
                    {copiedId === "novo" ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => { setCreating(false); setCreatedUser(null); }}
                className="w-full h-10 text-white text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
                style={{ background: "var(--surface-dark)" }}
              >
                Concluir
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-5" style={{ color: "var(--cr-text-secondary)" }}>
                A conta já entra liberada, sem passar pela solicitação de acesso. O e-mail
                é criado como confirmado e a senha é gerada automaticamente.
              </p>

              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--cr-text-secondary)" }} htmlFor="nu-nome">Nome</label>
                  <input
                    id="nu-nome" value={newName} onChange={e => setNewName(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm rounded-[var(--radius-md)] focus:outline-none"
                    style={{ background: "var(--surface-secondary)", color: "var(--cr-text-primary)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--cr-text-secondary)" }} htmlFor="nu-email">E-mail</label>
                  <input
                    id="nu-email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm rounded-[var(--radius-md)] focus:outline-none"
                    style={{ background: "var(--surface-secondary)", color: "var(--cr-text-primary)" }}
                  />
                </div>
              </div>

              {createError && (
                <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "#fdeceb", border: "1px solid #f3c9c9", color: "var(--cr-danger)" }}>
                  {createError}
                </div>
              )}

              <button
                onClick={createUser}
                disabled={createBusy || !newName.trim() || !newEmail.trim()}
                className="w-full h-10 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: "var(--surface-dark)" }}
              >
                {createBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : "Criar conta"}
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
